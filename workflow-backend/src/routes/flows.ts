import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { emitEvent } from '../lib/audit.js';

const OutputFieldSchema = z.object({
  key:   z.string().min(1),
  label: z.string().min(1),
  type:  z.enum(['string', 'number', 'boolean', 'object', 'array']),
});

const SaveFlowSchema = z.object({
  id:              z.string().uuid().nullish(),
  name:            z.string().min(1),
  category:        z.string().optional(),
  status:          z.enum(['draft', 'published']),
  flowType:        z.enum(['general', 'node', 'master']).default('general'),
  outputSchema:    z.array(OutputFieldSchema).default([]),
  visibleToRoles:  z.array(z.string()).default([]),
  runnableByRoles: z.array(z.string()).default([]),
  nodes:           z.array(z.any()),
  edges:           z.array(z.any()),
});

const flowsRoute: FastifyPluginAsync = async (fastify) => {
  const db = fastify.db;

  // GET /flows — list summaries (role-filtered)
  fastify.get('/flows', { onRequest: [fastify.verifyJwt] }, async (request) => {
    const userRoles: string[] = (request as any).user?.roles ?? [];
    const isAdmin = userRoles.includes('Org Admin') || userRoles.includes('Platform Admin');

    const all = await db.flow.findMany({
      select: {
        id: true, name: true, category: true, status: true,
        flowType: true, outputSchema: true, visibleToRoles: true, runnableByRoles: true,
        nodeCount: true, savedAt: true, publishedAt: true,
      },
      orderBy: { savedAt: 'desc' },
    });

    if (isAdmin) return all;

    return all.filter((f) => {
      const roles = f.visibleToRoles as string[];
      return roles.length === 0 || roles.some((r) => userRoles.includes(r));
    });
  });

  // GET /flows/node-palette — published node flows for the canvas palette
  fastify.get('/flows/node-palette', { onRequest: [fastify.verifyJwt] }, async () => {
    return db.flow.findMany({
      where: { status: 'published', flowType: 'node' },
      select: { id: true, name: true, category: true, outputSchema: true, publishedAt: true },
      orderBy: { name: 'asc' },
    });
  });

  // GET /flows/:id
  fastify.get<{ Params: { id: string } }>(
    '/flows/:id',
    { onRequest: [fastify.verifyJwt] },
    async (request, reply) => {
      const flow = await db.flow.findUnique({ where: { id: request.params.id } });
      if (!flow) return reply.code(404).send({ error: `Flow ${request.params.id} not found` });
      return flow;
    },
  );

  // POST /flows — create or update
  fastify.post('/flows', { onRequest: [fastify.verifyJwt] }, async (request, reply) => {
    const parse = SaveFlowSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.code(400).send({ error: 'Validation failed', issues: parse.error.issues });
    }
    const dto = parse.data;

    if (dto.status === 'published') {
      const nodeIds = (dto.nodes as any[]).map((n) => n.data?.meta?.Nodeid);
      if (!nodeIds.includes('flow-start') || !nodeIds.includes('flow-end')) {
        return reply.code(400).send({
          error: 'Published flow must contain a Start node and an End node',
        });
      }
    }

    const now = new Date();

    if (dto.id) {
      try {
        const flow = await db.flow.update({
          where: { id: dto.id },
          data: {
            name: dto.name,
            ...(dto.category ? { category: dto.category } : {}),
            status: dto.status,
            flowType: dto.flowType,
            outputSchema: dto.outputSchema,
            visibleToRoles: dto.visibleToRoles,
            runnableByRoles: dto.runnableByRoles,
            nodes: dto.nodes,
            edges: dto.edges,
            nodeCount: dto.nodes.length,
            ...(dto.status === 'published' ? { publishedAt: now } : {}),
          },
        });
        emitEvent(fastify, request,
          dto.status === 'published' ? 'flow.publish' : 'flow.save',
          'flow', flow.id, { name: flow.name, status: flow.status });
        return flow;
      } catch (e: any) {
        if (e?.code === 'P2025') return reply.code(404).send({ error: `Flow ${dto.id} not found` });
        throw e;
      }
    }

    const flow = await db.flow.create({
      data: {
        name: dto.name,
        category: dto.category ?? '',
        status: dto.status,
        flowType: dto.flowType,
        outputSchema: dto.outputSchema,
        visibleToRoles: dto.visibleToRoles,
        runnableByRoles: dto.runnableByRoles,
        nodes: dto.nodes,
        edges: dto.edges,
        nodeCount: dto.nodes.length,
        publishedAt: dto.status === 'published' ? now : null,
      },
    });
    emitEvent(fastify, request, 'flow.create', 'flow', flow.id, { name: flow.name });
    return flow;
  });

  // GET /flows/:id/resolve?input=<value> — resolve flow options for a select field
  // For now returns the flow's configured static options or mock data.
  // When Temporal is active this will execute the flow as a child workflow.
  fastify.get<{ Params: { id: string }; Querystring: { input?: string } }>(
    '/flows/:id/resolve',
    { onRequest: [fastify.verifyJwt] },
    async (request, reply) => {
      const flow = await db.flow.findUnique({ where: { id: request.params.id } });
      if (!flow) return reply.code(404).send({ error: 'Flow not found' });
      if (flow.status !== 'published') return reply.code(400).send({ error: 'Flow is not published' });

      const input = request.query.input;

      // Extract options from nodes that have type "flow-output" or from first Form node options
      const nodes = (flow.nodes as any[]);
      const outputNode = nodes.find((n) => n.data?.meta?.Nodeid === 'flow-output' || n.data?.meta?.Nodeid === 'form');

      // Pull static options configured on the node, filtered by input if provided
      const rawOptions: string[] = outputNode?.data?.config?.options ?? [];
      const options = input
        ? rawOptions.filter((o: string) => o.toLowerCase().includes(input.toLowerCase()))
        : rawOptions;

      return { flowId: flow.id, flowName: flow.name, input: input ?? null, options };
    },
  );

  // DELETE /flows/:id
  fastify.delete<{ Params: { id: string } }>(
    '/flows/:id',
    { onRequest: [fastify.verifyJwt] },
    async (request, reply) => {
      try {
        const flow = await db.flow.delete({ where: { id: request.params.id } });
        emitEvent(fastify, request, 'flow.delete', 'flow', request.params.id, { name: flow.name });
        return { deleted: request.params.id };
      } catch {
        return reply.code(404).send({ error: `Flow ${request.params.id} not found` });
      }
    },
  );
};

export default flowsRoute;
