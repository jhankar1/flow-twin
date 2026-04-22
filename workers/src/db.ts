import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

// One pool + one PrismaClient shared across all workers in this process.
const pool = new pg.Pool({
  connectionString: (process.env.DATABASE_URL ?? '') + '?schema=app',
  max: 10,
});

const adapter = new PrismaPg(pool, { schema: 'app' });
export const db = new PrismaClient({ adapter });

export async function closeDb(): Promise<void> {
  await db.$disconnect();
  await pool.end();
}
