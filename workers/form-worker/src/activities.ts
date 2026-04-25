import { io, Socket } from 'socket.io-client';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'toggle' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  unit?: string;
  options?: string[];
}

export interface FormStepConfig {
  title: string;
  fields: FormField[];
  submitLabel?: string;
  _errors?: Record<string, string>;
}

type WorkerEvent =
  | { type: 'STEP_READY'; lotId: string; nodeId: string; config: FormStepConfig }
  | { type: 'BATCH_COMPLETE'; lotId: string };

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.API_URL ?? 'http://localhost:4000', {
      path: '/socket.io',
      auth: { workerServiceKey: process.env.WORKER_SERVICE_KEY ?? 'internal' },
      reconnection: true,
    });
    socket.on('connect', () => console.log('[FormWorker] Socket.io connected'));
    socket.on('disconnect', () => console.log('[FormWorker] Socket.io disconnected'));
  }
  return socket;
}

export function closeSocket(): void {
  socket?.disconnect();
  socket = null;
}

function push(workerId: string, event: WorkerEvent): void {
  getSocket().emit('worker:push', { workerId, event });
}

export async function serveFormStep(params: {
  lotId: string;
  nodeId: string;
  workerId: string;
  config: FormStepConfig;
}): Promise<void> {
  push(params.workerId, {
    type: 'STEP_READY',
    lotId: params.lotId,
    nodeId: params.nodeId,
    config: params.config,
  });
  console.log(`[FormWorker] Served step ${params.nodeId} → worker ${params.workerId}`);
}

export async function validateFormSubmission(params: {
  fieldValues: Record<string, unknown>;
  config: FormStepConfig;
}): Promise<{ valid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};

  for (const field of params.config.fields) {
    const value = params.fieldValues[field.id];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.id] = `${field.label} is required`;
      continue;
    }

    if (field.type === 'number' && value !== undefined && value !== '') {
      const num = Number(value);
      if (isNaN(num)) {
        errors[field.id] = `${field.label} must be a number`;
      } else {
        if (field.min !== undefined && num < field.min)
          errors[field.id] = `${field.label} must be ≥ ${field.min}${field.unit ? ' ' + field.unit : ''}`;
        if (field.max !== undefined && num > field.max)
          errors[field.id] = `${field.label} must be ≤ ${field.max}${field.unit ? ' ' + field.unit : ''}`;
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export async function notifyBatchComplete(params: {
  lotId: string;
  workerId: string;
}): Promise<void> {
  push(params.workerId, { type: 'BATCH_COMPLETE', lotId: params.lotId });
}
