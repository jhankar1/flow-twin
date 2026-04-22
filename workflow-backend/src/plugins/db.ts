import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: PrismaClient;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  // Keycloak owns the "public" schema — app tables live in "app" schema
  const connectionString = (process.env.DATABASE_URL ?? '') + '?schema=app';

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool, { schema: 'app' });
  const prisma = new PrismaClient({ adapter });

  fastify.decorate('db', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
    await pool.end();
  });
};

export default fp(dbPlugin, { name: 'db' });
