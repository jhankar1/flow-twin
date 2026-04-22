import type { FastifyPluginAsync } from 'fastify';

// Each worker server has a /health HTTP endpoint on its own port.
// Add entries here as workers are brought online.
const WORKER_SERVERS = [
  { id: 'form-worker',     label: 'Form Worker',     url: process.env.FORM_WORKER_URL     ?? 'http://localhost:4001' },
  { id: 'approval-worker', label: 'Approval Worker', url: process.env.APPROVAL_WORKER_URL ?? 'http://localhost:4002' },
  { id: 'db-worker',       label: 'DB Worker',       url: process.env.DB_WORKER_URL       ?? 'http://localhost:4003' },
  { id: 'notif-worker',    label: 'Notif Worker',    url: process.env.NOTIF_WORKER_URL    ?? 'http://localhost:4004' },
  { id: 'ai-worker',       label: 'AI Worker',       url: process.env.AI_WORKER_URL       ?? 'http://localhost:4005' },
  { id: 'mqtt-worker',     label: 'MQTT Worker',     url: process.env.MQTT_WORKER_URL     ?? 'http://localhost:4006' },
  { id: 'report-worker',   label: 'Report Worker',   url: process.env.REPORT_WORKER_URL   ?? 'http://localhost:4007' },
];

type ServiceStatus = 'ok' | 'error' | 'unknown';

interface ServiceInfo {
  id: string;
  label: string;
  url: string;
  status: ServiceStatus;
  latencyMs: number | null;
  detail?: string;
}

async function pingUrl(url: string): Promise<{ status: ServiceStatus; latencyMs: number; detail?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
    const latencyMs = Date.now() - start;
    return { status: res.status < 500 ? 'ok' : 'error', latencyMs, detail: `HTTP ${res.status}` };
  } catch (err: any) {
    return { status: 'error', latencyMs: Date.now() - start, detail: err?.message ?? 'unreachable' };
  }
}

async function checkPostgres(fastify: Parameters<FastifyPluginAsync>[0]): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const start = Date.now();
  try {
    await Promise.race([
      fastify.db.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error', latencyMs: Date.now() - start };
  }
}

async function checkKeycloak(): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const url = `${process.env.KEYCLOAK_URL ?? 'http://localhost:8080'}/realms/master`;
  return pingUrl(url.replace('/realms/master', ''));
}

async function checkTemporal(): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const url = `${process.env.TEMPORAL_UI_URL ?? 'http://localhost:8088'}/api/v1/namespaces`;
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return { status: res.status < 500 ? 'ok' : 'error', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error', latencyMs: Date.now() - start };
  }
}

const servicesRoute: FastifyPluginAsync = async (fastify) => {
  // GET /admin/services — full service status (auth required)
  fastify.get('/admin/services', { onRequest: [fastify.verifyJwt] }, async (_request, reply) => {
    const [pgResult, kcResult, tempResult, ...workerResults] = await Promise.all([
      checkPostgres(fastify),
      checkKeycloak(),
      checkTemporal(),
      ...WORKER_SERVERS.map((w) => pingUrl(w.url).then((r) => ({ ...w, ...r }))),
    ]);

    const infrastructure: ServiceInfo[] = [
      { id: 'postgres',   label: 'PostgreSQL',    url: process.env.DATABASE_URL ?? 'localhost:5432', ...pgResult },
      { id: 'keycloak',   label: 'Keycloak',      url: process.env.KEYCLOAK_URL ?? 'http://localhost:8080', ...kcResult },
      { id: 'temporal',   label: 'Temporal',      url: process.env.TEMPORAL_UI_URL ?? 'http://localhost:8088', ...tempResult },
      { id: 'gateway',    label: 'API Gateway',   url: `http://localhost:${process.env.PORT ?? 3001}`, status: 'ok', latencyMs: 0 },
    ];

    const workers: ServiceInfo[] = WORKER_SERVERS.map((w, i) => ({
      id: w.id,
      label: w.label,
      url: w.url,
      ...(workerResults[i] as any),
    }));

    const allOk = [...infrastructure, ...workers].every((s) => s.status === 'ok' || s.id.endsWith('-worker'));

    return reply.send({ status: allOk ? 'ok' : 'degraded', infrastructure, workers });
  });
};

export default servicesRoute;
