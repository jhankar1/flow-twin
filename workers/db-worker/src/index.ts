import 'dotenv/config';
import { fileURLToPath } from 'url';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities.js';
import { closeDb } from './db.js';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE ?? 'default';

async function main() {
  const connection = await NativeConnection.connect({ address: TEMPORAL_ADDRESS });

  const worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: 'db-worker',
    workflowsPath: fileURLToPath(new URL('./workflows.js', import.meta.url)),
    activities,
  });

  console.log('[db-worker] Started — task queue: db-worker');
  await worker.run();
  await closeDb();
  await connection.close();
}

main().catch(async (err) => {
  console.error('[db-worker] Fatal:', err);
  await closeDb();
  process.exit(1);
});
