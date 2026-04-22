import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { emitEvent } from '../lib/audit.js';
import { checkNodePermission, type NodePermissions } from '../lib/node-permissions.js';

const PermissionsSchema = z.object({
  view:  z.array(z.string()).optional(),
  edit:  z.array(z.string()).optional(),
  entry: z.array(z.string()).optional(),
}).optional();

const SubmitSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  fieldValues: z.record(z.unknown()).default({}),
  nodePermissions: PermissionsSchema,   // passed from frontend node config
});

const DecideSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

const approvalsRoute: FastifyPluginAsync = async (fastify) => {

  // POST /api/approvals — User A submits a request
  fastify.post('/approvals', { onRequest: [fastify.verifyJwt] }, async (request, reply) => {
    const parse = SubmitSchema.safeParse(request.body);
    if (!parse.success) return reply.code(400).send({ error: 'Validation failed', issues: parse.error.issues });

    const { title, description, fieldValues, nodePermissions } = parse.data;
    const user = request.user;
    const submitterName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

    // Enforce node entry permission
    const canEnter = checkNodePermission(nodePermissions as NodePermissions, user.roles ?? [], 'entry');
    if (!canEnter) {
      return reply.code(403).send({ error: 'You do not have permission to submit data for this node' });
    }

    const record = await fastify.prisma.approvalRequest.create({
      data: {
        title,
        description,
        fieldValues,
        submittedBy: user.id,
        submitterName,
      },
    });

    emitEvent(fastify, request, 'approval.submit', 'approval', record.id, { title: record.title });
    return reply.code(201).send(record);
  });

  // GET /api/approvals — list all (pending first)
  fastify.get('/approvals', { onRequest: [fastify.verifyJwt] }, async (request) => {
    const records = await fastify.prisma.approvalRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return records;
  });

  // GET /api/approvals/pending/count — notification badge
  fastify.get('/approvals/pending/count', { onRequest: [fastify.verifyJwt] }, async () => {
    const count = await fastify.prisma.approvalRequest.count({ where: { status: 'pending' } });
    return { count };
  });

  // POST /api/approvals/:id/decide — User B approves or rejects
  fastify.post<{ Params: { id: string } }>(
    '/approvals/:id/decide',
    { onRequest: [fastify.verifyJwt] },
    async (request, reply) => {
      const parse = DecideSchema.safeParse(request.body);
      if (!parse.success) return reply.code(400).send({ error: 'Validation failed', issues: parse.error.issues });

      const { decision, reason } = parse.data;
      const user = request.user;
      const deciderName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

      // Only supervisors / managers / admins can decide
      const approverRoles = ['QA Supervisor', 'Manager', 'Org Admin'];
      const canDecide = user.roles?.some((r: string) => approverRoles.includes(r));
      if (!canDecide) return reply.code(403).send({ error: 'You do not have permission to approve or reject requests' });

      const existing = await fastify.prisma.approvalRequest.findUnique({ where: { id: request.params.id } });
      if (!existing) return reply.code(404).send({ error: 'Not found' });
      if (existing.status !== 'pending') return reply.code(409).send({ error: 'Already decided' });

      const updated = await fastify.prisma.approvalRequest.update({
        where: { id: request.params.id },
        data: {
          status: decision,
          decidedBy: user.id,
          deciderName,
          reason: reason ?? null,
          decidedAt: new Date(),
        },
      });

      emitEvent(fastify, request, `approval.${decision}`, 'approval', updated.id,
        { title: updated.title, reason: reason ?? null });
      return updated;
    },
  );
};

export default approvalsRoute;
