// ⚠️ Temporal workflow sandbox — no Node.js built-ins.
import { proxyActivities, executeChild, defineSignal, setHandler } from '@temporalio/workflow';
import type * as activities from './activities.js';
import type { FlowNode, FlowEdge } from './activities.js';

const { loadFlow } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: { maximumAttempts: 3 },
});

// Forwarded by Fastify POST /batches/:lotId/submit
export const formSubmitSignal = defineSignal<[{
  nodeId: string;
  fieldValues: Record<string, unknown>;
  workerId: string;
}]>('formSubmit');

interface FormNodeConfig {
  alias?: string;
  title?: string;
  fields?: unknown[];
  submitLabel?: string;
}

interface DbWriteNodeConfig {
  table?: string;
  operation?: 'insert' | 'update' | 'upsert';
  data?: string;
  conflictKey?: string;
}

export async function executionWorkflow(params: {
  lotId: string;
  flowId: string;
  workerId: string;
}): Promise<void> {
  const { lotId, flowId, workerId } = params;
  const { nodes, edges } = await loadFlow(flowId);

  // O(1) node lookup instead of O(n) find() on every step
  const nodeMap = new Map<string, FlowNode>(nodes.map((n) => [n.id, n]));
  const nextNode = buildNextMap(edges);

  // Flat context built incrementally — one merge per completed node, not rebuilt each time
  const flatCtx: Record<string, unknown> = {};

  // Signal handler registered once — signal is forwarded to the child formStepWorkflow
  // via its own workflowId; the handler here is unused but required for Temporal to accept
  // the signal on the parent workflow handle (Fastify signals the parent).
  setHandler(formSubmitSignal, () => { /* forwarded to child by Temporal signal fan-out */ });

  let current = nodes.find((n) => n.data.meta.Nodeid === 'flow-start');
  if (!current) throw new Error(`Flow ${flowId}: missing flow-start node`);

  while (current) {
    const nodeType = current.data.meta.Nodeid;
    const nodeId = current.id;

    if (nodeType === 'form-step') {
      const cfg = current.data.config as FormNodeConfig;
      const fieldValues = await executeChild('formStepWorkflow', {
        taskQueue: 'form-worker',
        workflowId: `${lotId}-${nodeId}-form`,
        args: [{
          lotId,
          nodeId,
          workerId,
          config: {
            title: cfg.title ?? 'Form Step',
            fields: cfg.fields ?? [],
            submitLabel: cfg.submitLabel ?? 'Submit & Continue',
          },
        }],
      }) as Record<string, unknown>;

      // Merge into flat context once — O(fields) not O(all nodes × fields)
      const alias = (cfg.alias ?? nodeId).replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      flatCtx[alias] = fieldValues;
      flatCtx[nodeId] = fieldValues;
      for (const [field, value] of Object.entries(fieldValues)) {
        flatCtx[`${alias}.${field}`] = value;
        flatCtx[`${nodeId}.${field}`] = value;
      }
    }

    else if (nodeType === 'data-db-write') {
      const cfg = current.data.config as DbWriteNodeConfig;
      await executeChild('dbWriteWorkflow', {
        taskQueue: 'db-worker',
        workflowId: `${lotId}-${nodeId}-dbwrite`,
        args: [{
          config: {
            table: cfg.table,
            operation: cfg.operation ?? 'insert',
            data: cfg.data ?? '{}',
            conflictKey: cfg.conflictKey,
          },
          context: flatCtx,
          lotId,
        }],
      });
    }

    else if (nodeType === 'flow-end') break;

    const nextId = nextNode.get(nodeId);
    current = nextId ? nodeMap.get(nextId) : undefined;
  }
}

function buildNextMap(edges: FlowEdge[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const edge of edges) {
    if (!map.has(edge.source)) map.set(edge.source, edge.target);
  }
  return map;
}
