# Platform Installation Guide — Phase 1
## Focus: Infrastructure + Form Worker

> **Goal by end of this guide**: One complete flow step runs end-to-end.
> Designer builds a form node → Worker sees it on ENB screen → Worker submits → Temporal advances.

---

## Prerequisites

```bash
# Required on your server / dev machine
node --version     # v20+ required
pnpm --version     # v8+ required  (npm install -g pnpm)
docker --version   # v24+ required
docker compose version  # v2.20+ required
git --version      # any recent version
```

---

## Step 1 — Create Monorepo

```bash
mkdir platform && cd platform
git init

# Create pnpm workspace
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'workers/*'
  - 'packages/*'
EOF

cat > package.json << EOF
{
  "name": "platform",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build"
  }
}
EOF

pnpm add -D turbo typescript -w
```

---

## Step 2 — Infrastructure (Docker)

Create `infra/docker-compose.yml`:

```yaml
version: '3.8'

services:

  # PostgreSQL — primary database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: platform
      POSTGRES_PASSWORD: platform_secret
      POSTGRES_DB: platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Valkey — cache (Apache 2.0 Redis replacement)
  valkey:
    image: valkey/valkey:7-alpine
    ports:
      - "6379:6379"

  # Temporal — workflow engine
  temporal:
    image: temporalio/auto-setup:1.24
    ports:
      - "7233:7233"
    environment:
      - DB=postgresql
      - DB_PORT=5432
      - POSTGRES_USER=platform
      - POSTGRES_PWD=platform_secret
      - POSTGRES_SEEDS=postgres
    depends_on:
      - postgres

  # Temporal UI — see workflows visually
  temporal-ui:
    image: temporalio/ui:2.26
    ports:
      - "8080:8080"
    environment:
      - TEMPORAL_ADDRESS=temporal:7233
    depends_on:
      - temporal

  # Keycloak — auth + multi-tenant
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin_secret
    ports:
      - "8180:8080"

volumes:
  postgres_data:
```

```bash
# Start all infrastructure
cd infra
docker compose up -d

# Verify everything is running
docker compose ps
```

Expected output:
```
NAME          STATUS
postgres      running
valkey        running
temporal      running
temporal-ui   running
keycloak      running
```

Temporal UI: http://localhost:8080
Keycloak Admin: http://localhost:8180 (admin / admin_secret)

---

## Step 3 — Shared Packages

### 3a — Shared Types

```bash
mkdir -p packages/types && cd packages/types
pnpm init
pnpm add zod
```

Create `packages/types/src/index.ts`:

```typescript
import { z } from 'zod'

// ─── Tenant ──────────────────────────────────────────────
export const OrganisationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  plan: z.enum(['starter', 'growth', 'pro', 'enterprise']),
  keycloakRealm: z.string(),
  temporalNamespace: z.string(),
  dbSchema: z.string(),
  storageBucket: z.string(),
  createdAt: z.date(),
})
export type Organisation = z.infer<typeof OrganisationSchema>

// ─── Flow ─────────────────────────────────────────────────
export const NodeTypeSchema = z.enum([
  'start', 'end', 'form', 'condition', 'wait',
  'send_email', 'send_sms', 'webhook', 'rest_api',
  'db_read', 'db_write', 'ai_decision', 'notification',
  'approval', 'script', 'parallel',
  'payment', 'seat_select', 'doc_upload', 'otp_verify',
  'slot_booking', 'e_signature', 'role_assign',
  'account_create', 'sla_timer', 'multi_approve',
  'sensor_read', 'actuator_cmd', 'qa_check',
  'batch_record', 'monitor_start', 'compliance',
])
export type NodeType = z.infer<typeof NodeTypeSchema>

export const FlowNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  label: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.unknown()),
  edges: z.object({
    onSuccess: z.string().optional(),
    onFailure: z.string().optional(),
    onTrue: z.string().optional(),
    onFalse: z.string().optional(),
  }).optional(),
})
export type FlowNode = z.infer<typeof FlowNodeSchema>

export const FlowTemplateSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string(),
  version: z.number().default(1),
  nodes: z.array(FlowNodeSchema),
  createdBy: z.string().uuid(),
  publishedAt: z.date().nullable(),
})
export type FlowTemplate = z.infer<typeof FlowTemplateSchema>

// ─── Batch ────────────────────────────────────────────────
export const BatchStatusSchema = z.enum([
  'running', 'pending_approval', 'paused', 'complete', 'failed'
])

export const BatchSchema = z.object({
  id: z.string(),          // e.g. GIN-2026-0041
  orgId: z.string().uuid(),
  flowId: z.string().uuid(),
  workerId: z.string().uuid(),
  status: BatchStatusSchema,
  currentNodeId: z.string().optional(),
  startedAt: z.date(),
  completedAt: z.date().nullable(),
})
export type Batch = z.infer<typeof BatchSchema>

// ─── Form Worker Types ─────────────────────────────────────
export const FormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'phone', 'email', 'select', 'checkbox', 'textarea']),
  required: z.boolean().default(false),
  min: z.number().optional(),
  max: z.number().optional(),
  unit: z.string().optional(),
  options: z.array(z.string()).optional(),
})
export type FormField = z.infer<typeof FormFieldSchema>

export const FormNodeConfigSchema = z.object({
  title: z.string(),
  fields: z.array(FormFieldSchema),
  submitLabel: z.string().default('Submit'),
})
export type FormNodeConfig = z.infer<typeof FormNodeConfigSchema>

export const FormSubmissionSchema = z.object({
  batchId: z.string(),
  nodeId: z.string(),
  workerId: z.string().uuid(),
  values: z.record(z.unknown()),
  submittedAt: z.date(),
})
export type FormSubmission = z.infer<typeof FormSubmissionSchema>

// ─── WebSocket Events ──────────────────────────────────────
export type WSEvent =
  | { type: 'STEP_READY';     batchId: string; nodeId: string; config: FormNodeConfig }
  | { type: 'STEP_SUBMITTED'; batchId: string; nodeId: string }
  | { type: 'STEP_APPROVED';  batchId: string; nodeId: string }
  | { type: 'STEP_REJECTED';  batchId: string; nodeId: string; reason: string }
  | { type: 'BATCH_COMPLETE'; batchId: string }
  | { type: 'NOTIFICATION';   message: string; level: 'info' | 'warn' | 'error' }
```

---

## Step 4 — Database (Prisma)

```bash
mkdir -p packages/db && cd packages/db
pnpm init
pnpm add prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

Create `packages/db/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organisation {
  id                String    @id @default(uuid())
  name              String
  slug              String    @unique
  plan              String    @default("starter")
  keycloakRealm     String    @unique
  temporalNamespace String    @unique
  dbSchema          String    @unique
  storageBucket     String    @unique
  createdAt         DateTime  @default(now())
  users             User[]
  flows             FlowTemplate[]
  batches           Batch[]
}

model User {
  id          String   @id @default(uuid())
  orgId       String
  email       String
  role        String   // designer | worker | qa_supervisor | manager | iiot_admin | org_admin
  keycloakId  String   @unique
  createdAt   DateTime @default(now())
  org         Organisation @relation(fields: [orgId], references: [id])
  batches     Batch[]
  @@unique([orgId, email])
}

model FlowTemplate {
  id          String    @id @default(uuid())
  orgId       String
  name        String
  version     Int       @default(1)
  nodes       Json
  createdBy   String
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  org         Organisation @relation(fields: [orgId], references: [id])
  batches     Batch[]
}

model Batch {
  id            String    @id   // GIN-2026-0041 format
  orgId         String
  flowId        String
  workerId      String
  status        String    @default("running")
  currentNodeId String?
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
  org           Organisation  @relation(fields: [orgId], references: [id])
  flow          FlowTemplate  @relation(fields: [flowId], references: [id])
  worker        User          @relation(fields: [workerId], references: [id])
  entries       BatchEntry[]
}

model BatchEntry {
  id          String   @id @default(uuid())
  batchId     String
  nodeId      String
  fieldValues Json
  status      String   @default("ok")  // ok | flagged | approved | rejected
  submittedAt DateTime @default(now())
  batch       Batch    @relation(fields: [batchId], references: [id])
}
```

```bash
# Set DATABASE_URL in .env
echo 'DATABASE_URL="postgresql://platform:platform_secret@localhost:5432/platform"' > .env

# Run migrations
npx prisma migrate dev --name init
npx prisma generate
```

---

## Step 5 — Form Worker

```bash
mkdir -p workers/form-worker && cd workers/form-worker
pnpm init
pnpm add @temporalio/worker @temporalio/activity @temporalio/workflow
pnpm add socket.io-client zod
pnpm add -D typescript ts-node @types/node
```

Create `workers/form-worker/src/activities.ts`:

```typescript
import { Context } from '@temporalio/activity'
import { FormNodeConfig, FormSubmission, WSEvent } from '@platform/types'
import { io } from 'socket.io-client'

const socket = io(process.env.API_URL || 'http://localhost:3001')

// ─── Activity 1: Push form step to ENB screen ─────────────
export async function serveFormStep(params: {
  batchId: string
  nodeId: string
  workerId: string
  config: FormNodeConfig
}): Promise<void> {
  console.log(`[FormWorker] Serving step ${params.nodeId} to batch ${params.batchId}`)

  const event: WSEvent = {
    type: 'STEP_READY',
    batchId: params.batchId,
    nodeId: params.nodeId,
    config: params.config,
  }

  // Push to worker's ENB screen via WebSocket
  socket.emit('to_worker', { workerId: params.workerId, event })
}

// ─── Activity 2: Validate submitted field values ───────────
export async function validateFormSubmission(params: {
  submission: FormSubmission
  config: FormNodeConfig
}): Promise<{ valid: boolean; errors: Record<string, string> }> {
  const errors: Record<string, string> = {}

  for (const field of params.config.fields) {
    const value = params.submission.values[field.id]

    // Required check
    if (field.required && (value === undefined || value === null || value === '')) {
      errors[field.id] = `${field.label} is required`
      continue
    }

    // Number range check
    if (field.type === 'number' && value !== undefined) {
      const num = Number(value)
      if (field.min !== undefined && num < field.min) {
        errors[field.id] = `${field.label} must be at least ${field.min} ${field.unit || ''}`
      }
      if (field.max !== undefined && num > field.max) {
        errors[field.id] = `${field.label} must be at most ${field.max} ${field.unit || ''}`
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
```

Create `workers/form-worker/src/workflows.ts`:

```typescript
import { proxyActivities, defineSignal, setHandler, condition } from '@temporalio/workflow'
import type * as activities from './activities'
import { FormNodeConfig, FormSubmission } from '@platform/types'

const { serveFormStep, validateFormSubmission } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 hour',
})

// Signal — sent when worker submits the form
export const formSubmitSignal = defineSignal<[FormSubmission]>('formSubmit')

// ─── Main workflow: serve form, wait for submit, validate ──
export async function formStepWorkflow(params: {
  batchId: string
  nodeId: string
  workerId: string
  config: FormNodeConfig
}): Promise<FormSubmission> {

  // Step 1: Push form to ENB screen
  await serveFormStep(params)

  // Step 2: Wait for worker to submit (can wait forever — Temporal handles this)
  let submission: FormSubmission | null = null

  setHandler(formSubmitSignal, (s: FormSubmission) => {
    submission = s
  })

  // Block until submission received
  await condition(() => submission !== null)

  // Step 3: Validate submission
  const { valid, errors } = await validateFormSubmission({
    submission: submission!,
    config: params.config,
  })

  if (!valid) {
    // Re-serve form with errors — worker must correct and resubmit
    await serveFormStep({ ...params, config: { ...params.config, errors } as any })
    // Wait for resubmission
    submission = null
    await condition(() => submission !== null)
  }

  return submission!
}
```

Create `workers/form-worker/src/index.ts`:

```typescript
import { Worker } from '@temporalio/worker'
import * as activities from './activities'

async function main() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'form-worker',
  })

  console.log('[FormWorker] Starting — listening on task queue: form-worker')
  await worker.run()
}

main().catch((err) => {
  console.error('[FormWorker] Fatal error:', err)
  process.exit(1)
})
```

```bash
# Run the Form Worker
cd workers/form-worker
npx ts-node src/index.ts
```

Expected output:
```
[FormWorker] Starting — listening on task queue: form-worker
```

---

## Step 6 — API Gateway (Fastify)

```bash
mkdir -p apps/api && cd apps/api
pnpm init
pnpm add fastify @fastify/cors @fastify/websocket
pnpm add @temporalio/client socket.io
pnpm add zod
```

Create `apps/api/src/index.ts`:

```typescript
import Fastify from 'fastify'
import { Server } from 'socket.io'
import { Connection, Client } from '@temporalio/client'
import { formStepWorkflow, formSubmitSignal } from '@platform/form-worker'
import { FormSubmission } from '@platform/types'

const fastify = Fastify({ logger: true })

// ─── WebSocket (Socket.io) ─────────────────────────────────
const io = new Server(fastify.server, {
  cors: { origin: '*' }
})

// Store connected workers: workerId → socket
const connectedWorkers = new Map<string, any>()

io.on('connection', (socket) => {
  const workerId = socket.handshake.auth.workerId
  if (workerId) {
    connectedWorkers.set(workerId, socket)
    console.log(`[API] Worker connected: ${workerId}`)
  }

  // Forward events to specific worker
  socket.on('to_worker', ({ workerId, event }) => {
    const workerSocket = connectedWorkers.get(workerId)
    if (workerSocket) workerSocket.emit('event', event)
  })

  socket.on('disconnect', () => {
    connectedWorkers.delete(workerId)
  })
})

// ─── Temporal Client ───────────────────────────────────────
let temporalClient: Client

async function getTemporalClient() {
  if (!temporalClient) {
    const connection = await Connection.connect({ address: 'localhost:7233' })
    temporalClient = new Client({ connection })
  }
  return temporalClient
}

// ─── API Routes ────────────────────────────────────────────

// Start a batch (triggers first form step)
fastify.post('/batches/start', async (req, reply) => {
  const { flowId, workerId, orgId } = req.body as any
  const client = await getTemporalClient()

  const batchId = `BATCH-${Date.now()}`

  // Start Temporal workflow
  await client.workflow.start(formStepWorkflow, {
    taskQueue: 'form-worker',
    workflowId: `form-${batchId}-step1`,
    args: [{
      batchId,
      nodeId: 'node_01',
      workerId,
      config: {
        title: 'Step 1 — Raw Material Intake',
        fields: [
          { id: 'material_name', label: 'Material Name', type: 'text', required: true },
          { id: 'weight_kg', label: 'Weight (kg)', type: 'number', required: true, min: 0, max: 10000, unit: 'kg' },
          { id: 'supplier', label: 'Supplier', type: 'text', required: true },
        ],
        submitLabel: 'Submit Step',
      }
    }],
  })

  return { batchId, status: 'started' }
})

// Worker submits a form step
fastify.post('/batches/:batchId/submit', async (req, reply) => {
  const { batchId } = req.params as any
  const { nodeId, workerId, values } = req.body as any
  const client = await getTemporalClient()

  const submission: FormSubmission = {
    batchId,
    nodeId,
    workerId,
    values,
    submittedAt: new Date(),
  }

  // Signal the waiting Temporal workflow
  const handle = client.workflow.getHandle(`form-${batchId}-${nodeId}`)
  await handle.signal(formSubmitSignal, submission)

  return { status: 'submitted' }
})

// ─── Start server ──────────────────────────────────────────
fastify.listen({ port: 3001 }, (err) => {
  if (err) throw err
  console.log('[API] Running on http://localhost:3001')
})
```

```bash
cd apps/api
npx ts-node src/index.ts
```

---

## Step 7 — ENB Frontend (Minimal)

```bash
mkdir -p apps/web && cd apps/web
npx create-next-app@latest . --typescript --tailwind --app
pnpm add socket.io-client
```

Create `apps/web/app/enb/page.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { WSEvent, FormNodeConfig } from '@platform/types'

export default function ENBPage() {
  const [currentStep, setCurrentStep] = useState<FormNodeConfig | null>(null)
  const [batchId, setBatchId] = useState<string>('')
  const [nodeId, setNodeId] = useState<string>('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const WORKER_ID = 'worker-001'  // hardcoded for Phase 1 test

  useEffect(() => {
    const socket = io('http://localhost:3001', {
      auth: { workerId: WORKER_ID }
    })

    socket.on('event', (event: WSEvent) => {
      if (event.type === 'STEP_READY') {
        setCurrentStep(event.config)
        setBatchId(event.batchId)
        setNodeId(event.nodeId)
        setSubmitted(false)
        setValues({})
      }
    })

    return () => { socket.disconnect() }
  }, [])

  const handleSubmit = async () => {
    await fetch(`http://localhost:3001/batches/${batchId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId, workerId: WORKER_ID, values }),
    })
    setSubmitted(true)
  }

  if (!currentStep) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-400 text-lg">Waiting for next step...</p>
    </div>
  )

  if (submitted) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-green-600 text-lg font-medium">✅ Step submitted — waiting for next...</p>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto p-6 mt-10">
      <h1 className="text-2xl font-bold mb-6">{currentStep.title}</h1>
      {currentStep.fields.map((field) => (
        <div key={field.id} className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {field.label} {field.unit && <span className="text-gray-400">({field.unit})</span>}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            className="w-full border rounded px-3 py-2 text-lg"
            value={values[field.id] || ''}
            onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
            min={field.min}
            max={field.max}
          />
        </div>
      ))}
      <button
        onClick={handleSubmit}
        className="w-full bg-indigo-600 text-white py-3 rounded font-medium text-lg mt-4"
      >
        {currentStep.submitLabel}
      </button>
    </div>
  )
}
```

```bash
cd apps/web
pnpm dev
```

ENB screen: http://localhost:3000/enb

---

## Step 8 — Test the Full Flow

Open 3 terminals:

```bash
# Terminal 1 — Form Worker
cd workers/form-worker && npx ts-node src/index.ts

# Terminal 2 — API
cd apps/api && npx ts-node src/index.ts

# Terminal 3 — Frontend
cd apps/web && pnpm dev
```

Then test:

```bash
# Trigger a batch (in a 4th terminal or Postman)
curl -X POST http://localhost:3001/batches/start \
  -H "Content-Type: application/json" \
  -d '{"flowId": "flow-001", "workerId": "worker-001", "orgId": "org-001"}'

# Expected response:
# { "batchId": "BATCH-1711234567", "status": "started" }
```

Now open http://localhost:3000/enb — the form step should appear.

Fill in the fields and click Submit.

Check Temporal UI (http://localhost:8080) — workflow should show as completed.

---

## ✅ What You Have at End of Phase 1 Week 3

```
✅ Infrastructure running (PostgreSQL, Temporal, Valkey, Keycloak)
✅ Shared types defined (Org, Flow, Batch, FormField)
✅ Database schema migrated (Prisma)
✅ Form Worker live — listens on Temporal task queue
✅ API Gateway — starts batches, receives submissions
✅ ENB screen — shows form, submits to API
✅ Full round trip: API → Temporal → Worker → WebSocket → ENB → Submit → Signal → Temporal ✅
```

---

## Next Steps — Week 4+

```
Week 4   Add DB Worker — save batch entries to PostgreSQL
Week 5   Add Notif Worker — notify designer when step completes
Week 6   Chain multiple nodes — full multi-step flow runs
Week 7   Add Keycloak auth — real login, real tenants
Week 8   Add canvas (Activepieces fork) — designer builds flows visually
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Temporal won't start | Check postgres is healthy first: `docker compose ps` |
| Worker can't connect to Temporal | Verify address: `localhost:7233` |
| WebSocket not connecting | Check CORS settings in Socket.io server |
| Prisma migration fails | Check DATABASE_URL matches docker-compose credentials |
| Form not appearing on ENB | Check workerId matches in socket auth and API call |
