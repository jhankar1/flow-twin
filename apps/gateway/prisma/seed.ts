import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const pool = new pg.Pool({
  connectionString: (process.env.DATABASE_URL ?? '') + '?schema=app',
});
const adapter = new PrismaPg(pool, { schema: 'app' });
const prisma = new PrismaClient({ adapter });

// ─── Sample flow: Department Registration ─────────────────────────────────────
// flow-start → form-step (deptName, description, code) → data-db-write → flow-end

const FLOW_ID = '00000000-0000-0000-0000-000000000001';

const nodes = [
  {
    id: 'node-start',
    type: 'customNode',
    position: { x: 100, y: 200 },
    data: {
      meta: { Nodeid: 'flow-start', label: 'Start' },
      config: {
        flowName: 'Department Registration',
        triggerType: 'manual',
        lotIdPrefix: 'DEPT',
        description: 'Employee registers a new department.',
      },
    },
  },
  {
    id: 'node-form',
    type: 'customNode',
    position: { x: 400, y: 200 },
    data: {
      meta: { Nodeid: 'form-step', label: 'Department Details' },
      config: {
        alias: 'form_dept_entry',          // used in template resolution
        title: 'Department Registration',
        submitLabel: 'Submit & Continue',
        allowSaveDraft: false,
        fields: [
          {
            id: 'deptName',
            label: 'Department Name',
            type: 'text',
            required: true,
          },
          {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            required: true,
          },
          {
            id: 'code',
            label: 'Department Code',
            type: 'text',
            required: true,
          },
        ],
      },
    },
  },
  {
    id: 'node-dbwrite',
    type: 'customNode',
    position: { x: 700, y: 200 },
    data: {
      meta: { Nodeid: 'data-db-write', label: 'Save Department' },
      config: {
        table: 'departments',
        operation: 'insert',
        conflictKey: 'code',
        // Templates resolved by DB Worker at runtime using submitted form values
        data: JSON.stringify({
          batchId: '{{batch.id}}',
          deptName: '{{form_dept_entry.deptName}}',
          description: '{{form_dept_entry.description}}',
          code: '{{form_dept_entry.code}}',
        }),
      },
    },
  },
  {
    id: 'node-end',
    type: 'customNode',
    position: { x: 1000, y: 200 },
    data: {
      meta: { Nodeid: 'flow-end', label: 'End' },
      config: {},
    },
  },
];

const edges = [
  { id: 'e1', source: 'node-start',  target: 'node-form',    sourceHandle: 'out-1' },
  { id: 'e2', source: 'node-form',   target: 'node-dbwrite', sourceHandle: 'out-1' },
  { id: 'e3', source: 'node-dbwrite', target: 'node-end',    sourceHandle: 'out-1' },
];

async function main() {
  await prisma.flow.upsert({
    where: { id: FLOW_ID },
    create: {
      id: FLOW_ID,
      name: 'Department Registration',
      category: 'Business',
      status: 'published',
      nodes,
      edges,
      nodeCount: nodes.length,
      publishedAt: new Date(),
    },
    update: {
      nodes,
      edges,
      nodeCount: nodes.length,
      status: 'published',
    },
  });

  console.log('✅ Seeded: Department Registration flow (id:', FLOW_ID, ')');
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
