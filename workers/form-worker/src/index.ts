import 'dotenv/config';
import { fileURLToPath } from 'url';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities.js';
import { closeSocket } from './activities.js';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE ?? 'default';

async function main() {
  const connection = await NativeConnection.connect({ address: TEMPORAL_ADDRESS });

  const worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: 'form-worker',
    workflowsPath: fileURLToPath(new URL('./workflows.js', import.meta.url)),
    activities,
  });

  console.log('[form-worker] Started — task queue: form-worker');
  await worker.run();
  closeSocket();
  await connection.close();
}

main().catch((err) => {
  console.error('[form-worker] Fatal:', err);
  process.exit(1);
});
