// ⚠️ Temporal workflow sandbox — no Node.js built-ins.
import { proxyActivities, defineSignal, setHandler, condition } from '@temporalio/workflow';
import type * as activities from './activities.js';
import type { FormStepConfig } from './activities.js';

const { serveFormStep, validateFormSubmission } = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 hours',
  retry: { maximumAttempts: 3 },
});

export const formSubmitSignal = defineSignal<[{
  nodeId: string;
  fieldValues: Record<string, unknown>;
  workerId: string;
}]>('formSubmit');

// ─── formStepWorkflow ─────────────────────────────────────────────────────────
// Serves a form to the ENB screen and waits — indefinitely — for the worker
// to submit. Temporal's durable execution means this survives restarts.
export async function formStepWorkflow(params: {
  lotId: string;
  nodeId: string;
  workerId: string;
  config: FormStepConfig;
}): Promise<Record<string, unknown>> {
  await serveFormStep(params);

  type Submission = { nodeId: string; fieldValues: Record<string, unknown>; workerId: string };
  let submission: Submission | null = null;

  setHandler(formSubmitSignal, (sig) => {
    if (sig.nodeId === params.nodeId) submission = sig;
  });

  await condition(() => submission !== null);

  const { valid, errors } = await validateFormSubmission({
    fieldValues: submission!.fieldValues,
    config: params.config,
  });

  if (!valid) {
    // Re-push form with validation errors so the worker can correct and resubmit
    await serveFormStep({ ...params, config: { ...params.config, _errors: errors } });
    submission = null;
    await condition(() => submission !== null);
  }

  return submission!.fieldValues;
}
