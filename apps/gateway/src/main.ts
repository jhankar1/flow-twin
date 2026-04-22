import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import authPlugin from './plugins/auth.js';
import dbPlugin from './plugins/db.js';
import temporalPlugin from './plugins/temporal.js';
import socketioPlugin from './plugins/socketio.js';
import healthRoute from './routes/health.js';
import nodesRoute from './routes/nodes.js';
import processCategoriesRoute from './routes/process-categories.js';
import flowsRoute from './routes/flows.js';
import batchesRoute from './routes/batches.js';
import authRoute from './routes/auth.js';
import adminRoute from './routes/admin.js';
import approvalsRoute from './routes/approvals.js';
import logsRoute from './routes/logs.js';
import servicesRoute from './routes/services.js';
import keycloakAdminPlugin from './plugins/keycloak-admin.js';
import eventBusPlugin from './plugins/event-bus.js';
import { startLoggerWorker } from './workers/logger.worker.js';
import { startNotificationWorker } from './workers/notification.worker.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
});

await app.register(cookie, {
  secret: process.env.COOKIE_SECRET ?? 'change-me-in-production',
});

await app.register(eventBusPlugin);
await app.register(authPlugin);
await app.register(keycloakAdminPlugin);
await app.register(dbPlugin);
await app.register(temporalPlugin);
await app.register(socketioPlugin);

// Routes — all prefixed with /api
await app.register(healthRoute, { prefix: '/api' });
await app.register(nodesRoute, { prefix: '/api' });
await app.register(processCategoriesRoute, { prefix: '/api' });
await app.register(flowsRoute, { prefix: '/api' });
await app.register(batchesRoute, { prefix: '/api' });
await app.register(authRoute, { prefix: '/api' });
await app.register(adminRoute, { prefix: '/api' });
await app.register(approvalsRoute, { prefix: '/api' });
await app.register(logsRoute, { prefix: '/api' });
await app.register(servicesRoute, { prefix: '/api' });

// Start logger worker — subscribes to event bus
startLoggerWorker(app);
startNotificationWorker(app);

const port = Number(process.env.PORT ?? 4000);
await app.listen({ port, host: '0.0.0.0' });
console.log(`gateway running on http://localhost:${port}/api`);
