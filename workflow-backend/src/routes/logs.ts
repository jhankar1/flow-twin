import type { FastifyPluginAsync } from 'fastify';

const logsRoute: FastifyPluginAsync = async (fastify) => {
  // GET /api/logs?limit=50&entity=approval&action=approval.submit
  fastify.get('/logs', { onRequest: [fastify.verifyJwt] }, async (request) => {
    const { limit = '50', offset = '0', entity, action, userId } = request.query as Record<string, string>;

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      fastify.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit), 200),
        skip: Number(offset),
      }),
      fastify.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  });
};

export default logsRoute;
