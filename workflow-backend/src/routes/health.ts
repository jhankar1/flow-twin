import type { FastifyPluginAsync } from 'fastify';

async function checkPostgres(fastify: Parameters<FastifyPluginAsync>[0]): Promise<'ok' | 'error'> {
  try {
    await Promise.race([
      fastify.db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    return 'ok';
  } catch {
    return 'error';
  }
}

async function checkKeycloak(): Promise<'ok' | 'error'> {
  const url = `${process.env.KEYCLOAK_URL ?? 'http://localhost:8080'}/realms/master`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

async function checkTemporal(): Promise<'ok' | 'error'> {
  // gRPC port 7233 is not HTTP-checkable without the SDK — ping the UI proxy instead
  const url = `${process.env.TEMPORAL_URL ?? 'http://localhost:8088'}/api/v1/namespaces`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    // 200 or 401/403 both mean the server is up
    return res.status < 500 ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    const [postgres, keycloak, temporal] = await Promise.all([
      checkPostgres(fastify),
      checkKeycloak(),
      checkTemporal(),
    ]);

    const allOk = postgres === 'ok' && keycloak === 'ok' && temporal === 'ok';

    return reply.code(allOk ? 200 : 503).send({
      status: allOk ? 'ok' : 'degraded',
      services: { postgres, keycloak, temporal },
    });
  });
};

export default healthRoute;
