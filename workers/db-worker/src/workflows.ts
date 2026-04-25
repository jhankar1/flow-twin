// ⚠️ Temporal workflow sandbox — no Node.js built-ins.
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities.js';

const { dbWrite } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: { maximumAttempts: 3 },
});

export async function dbWriteWorkflow(params: {
  config: {
    table: string;
    operation: 'insert' | 'update' | 'upsert';
    data: string;
    conflictKey?: string;
  };
  context: Record<string, unknown>;
  lotId: string;
}): Promise<Record<string, unknown>> {
  return dbWrite(params);
}
