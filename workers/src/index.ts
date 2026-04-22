import 'dotenv/config';
import { fileURLToPath } from 'url';
import { Worker, NativeConnection } from '@temporalio/worker';
import { closeDb } from './db.js';
import { closeSocket } from './form/activities.js';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE ?? 'default';

const WORKER_DEFS = [
  { name: 'form-worker',        taskQueue: 'form-worker',        workflows: './form/workflows.ts' },
  { name: 'db-worker',          taskQueue: 'db-worker',          workflows: './db/workflows.ts' },
  { name: 'execution-workflow', taskQueue: 'execution-workflow', workflows: './execution/workflows.ts' },
] as const;

async function main() {
  const connection = await NativeConnection.connect({ address: TEMPORAL_ADDRESS });

  const formActivities      = await import('./form/activities.js');
  const dbActivities        = await import('./db/activities.js');
  const executionActivities = await import('./execution/activities.js');

  const activityMap = {
    'form-worker':        formActivities,
    'db-worker':          dbActivities,
    'execution-workflow': executionActivities,
  } as const;

  const workers = await Promise.all(
    WORKER_DEFS.map((def) =>
      Worker.create({
        connection,
        namespace: TEMPORAL_NAMESPACE,
        taskQueue: def.taskQueue,
        workflowsPath: fileURLToPath(new URL(def.workflows, import.meta.url)),
        activities: activityMap[def.name],
      }),
    ),
  );

  console.log('[Workers] All workers started:');
  WORKER_DEFS.forEach((d) => console.log(`  ✓ ${d.name.padEnd(22)} task queue: ${d.taskQueue}`));

  const results = await Promise.allSettled(workers.map((w) => w.run()));

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[Workers] ${WORKER_DEFS[i].name} crashed:`, result.reason);
    }
  });

  await cleanup(connection);
  process.exit(results.some((r) => r.status === 'rejected') ? 1 : 0);
}

async function cleanup(connection: NativeConnection) {
  closeSocket();
  await closeDb();
  await connection.close();
}

main().catch(async (err) => {
  console.error('[Workers] Fatal error during startup:', err);
  await closeDb();
  process.exit(1);
});
