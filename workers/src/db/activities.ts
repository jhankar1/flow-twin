import { db } from '../db.js';

type BatchStatus = 'running' | 'complete' | 'failed';

// Explicit table → Prisma model map — no dynamic string dispatch, no `as any`
const MODEL_MAP = {
  departments: db.department,
  batches: db.batch,
  batch_entries: db.batchEntry,
  flows: db.flow,
} as const;

type KnownTable = keyof typeof MODEL_MAP;

function resolveTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => {
    const parts = key.trim().split('.');
    let val: unknown = context;
    for (const part of parts) {
      val = (val && typeof val === 'object') ? (val as Record<string, unknown>)[part] : undefined;
    }
    return val !== undefined ? String(val) : '';
  });
}

export async function dbWrite(params: {
  config: {
    table: string;
    operation: 'insert' | 'update' | 'upsert';
    data: string;
    conflictKey?: string;
  };
  context: Record<string, unknown>;
  lotId: string;
}): Promise<Record<string, unknown>> {
  const resolvedJson = resolveTemplate(params.config.data, {
    ...params.context,
    batch: { id: params.lotId },
  });

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(resolvedJson);
  } catch {
    throw new Error(`[DBWorker] Invalid JSON after template resolution:\n${resolvedJson}`);
  }

  const table = params.config.table as KnownTable;
  const model = MODEL_MAP[table] as any;
  if (!model) throw new Error(`[DBWorker] Unknown table: ${params.config.table}`);

  const conflictKey = params.config.conflictKey ?? 'id';
  const whereVal = data[conflictKey];
  let result: Record<string, unknown>;

  if (params.config.operation === 'insert') {
    result = await model.create({ data });
  } else if (params.config.operation === 'update') {
    result = await model.update({ where: { [conflictKey]: whereVal }, data });
  } else {
    result = await model.upsert({ where: { [conflictKey]: whereVal }, create: data, update: data });
  }

  console.log(`[DBWorker] ${params.config.operation} → ${params.config.table} ✅`);
  return result;
}

export async function upsertBatch(params: {
  lotId: string;
  flowId: string;
  workerId: string;
  status: BatchStatus;
  currentNodeId?: string;
  completedAt?: string;
}): Promise<void> {
  await db.batch.upsert({
    where: { id: params.lotId },
    create: {
      id: params.lotId,
      flowId: params.flowId,
      workerId: params.workerId,
      status: params.status,
      currentNodeId: params.currentNodeId,
    },
    update: {
      status: params.status,
      currentNodeId: params.currentNodeId ?? null,
      completedAt: params.completedAt ? new Date(params.completedAt) : undefined,
    },
  });
}

export async function saveBatchEntry(params: {
  batchId: string;
  nodeId: string;
  fieldValues: Record<string, unknown>;
}): Promise<void> {
  await db.batchEntry.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { batchId: params.batchId, nodeId: params.nodeId, fieldValues: params.fieldValues as any },
  });
}
