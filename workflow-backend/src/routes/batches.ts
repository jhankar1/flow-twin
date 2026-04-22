import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const EXECUTION_TASK_QUEUE = 'execution-workflow';

const StartBatchSchema = z.object({
  flowId: z.string().uuid(),
  // lotPrefix lets the flow category drive the lot ID prefix (e.g. "DEPT", "IND", "CUST")
  lotPrefix: z.string().regex(/^[A-Z]{2,6}$/).default('BATCH'),
});

const SubmitStepSchema = z.object({
  nodeId: z.string(),
  fieldValues: z.record(z.unknown()),
});

const batchesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/batches/start',
    { onRequest: [fastify.verifyJwt] },
    async (request, reply) => {
      const parse = StartBatchSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.code(400).send({ error: 'Validation failed', issues: parse.error.issues });
      }

      const { flowId, lotPrefix } = parse.data;
      const workerId = request.user.id;

      const year = new Date().getFullYear();
      const seq = Date.now().toString().slice(-4);
      const lotId = `${lotPrefix}-${year}-${seq}`;

      await fastify.temporal.workflow.start('executionWorkflow', {
        taskQueue: EXECUTION_TASK_QUEUE,
        workflowId: `batch-${lotId}`,
        args: [{ lotId, flowId, workerId }],
      });

      return { lotId, workflowId: `batch-${lotId}`, status: 'running' };
    },
  );

  fastify.post<{ Params: { lotId: string } }>(
    '/batches/:lotId/submit',
    { onRequest: [fastify.verifyJwt] },
    async (request, reply) => {
      const parse = SubmitStepSchema.safeParse(request.body);
      if (!parse.success) {
        return reply.code(400).send({ error: 'Validation failed', issues: parse.error.issues });
      }

      const { lotId } = request.params;
      const { nodeId, fieldValues } = parse.data;

      const handle = fastify.temporal.workflow.getHandle(`batch-${lotId}`);
      await handle.signal('formSubmit', { nodeId, fieldValues, workerId: request.user.id });

      return { status: 'submitted' };
    },
  );

  // ── GET /batches/:lotId/status ──────────────────────────────────────────────
  fastify.get<{ Params: { lotId: string } }>(
    '/batches/:lotId/status',
    { onRequest: [fastify.verifyJwt] },
    async (request, reply) => {
      const { lotId } = request.params;
      try {
        const handle = fastify.temporal.workflow.getHandle(`batch-${lotId}`);
        const description = await handle.describe();
        return {
          lotId,
          status: description.status.name,
          startTime: description.startTime,
        };
      } catch {
        return reply.code(404).send({ error: `Batch ${lotId} not found` });
      }
    },
  );
};

export default batchesRoute;
