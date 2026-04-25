import 'dotenv/config';
import { fileURLToPath } from 'url';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities.js';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE ?? 'default';

async function main() {
  const connection = await NativeConnection.connect({ address: TEMPORAL_ADDRESS });

  const worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: 'execution-workflow',
    workflowsPath: fileURLToPath(new URL('./workflows.js', import.meta.url)),
    activities,
  });

  console.log('[execution-worker] Started — task queue: execution-workflow');
  await worker.run();
  await connection.close();
}

main().catch((err) => {
  console.error('[execution-worker] Fatal:', err);
  process.exit(1);
});
