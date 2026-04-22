# Digital Twin Platform — Project Context for Claude Code

> Read this file fully before writing any code, suggesting architecture,
> or making decisions. Every decision here was made intentionally.
> Do not revisit locked decisions without being explicitly asked to.

---

## What This Platform Is

A **no-code Industrial Digital Twin Platform** — a visual workflow builder
where designers build process flows once, workers execute them step by step,
and supervisors get notified and approve in real time.

```
Typeform      → User builds form    → Others fill it  → Creator gets response
THIS PLATFORM → Designer builds flow → Workers execute → Designer gets notified
```

Same mental model — but for physical industrial processes with sensors, AI,
and durable orchestration.

**Tagline**: "Build your factory process once. Your workers execute it. You see everything."

**Market**: Small and mid-size food processing, pharma, spice, agro-processing factories.
Replacing paper SOPs and WhatsApp-based process tracking.

---

## Builder Context

- **Solo full-stack data engineer** building this alone
- **No pressure, research phase** — building it right, not fast
- **Stack running in Docker**: Temporal, Keycloak, PostgreSQL (all healthy via `docker/docker-compose.yml`)
- **Frontend**: ~40% done — builder canvas, auth, dashboard, ENB run page, approvals, admin panel exist (`workflow-frontend/`)
- **Backend**: Running — Fastify gateway on port 4000, auth/JWT, flows CRUD, batches, approvals, admin, audit-log routes; 6 DB migrations done (`workflow-backend/`)
- **Workers**: Skeleton running — form, db, execution workers in single monolith (`workers/`); split into dedicated workers is next
- **POC goal**: one flow, 3 steps, 3 manual fields each, submit → approval → next step

---

## Three Process Categories

Same canvas, same Temporal, same workers — different node sets per category.

```
CATEGORY 1 — CUSTOMER PROCESS
  Bus ticket booking, loan application
  Public-facing. Customer is the actor. Self-serve.

CATEGORY 2 — BUSINESS PROCESS
  User onboarding, leave approval, KYC
  Internal. Employee executes. Manager approves.

CATEGORY 3 — INDUSTRIAL PROCESS
  Ginger syrup, turmeric processing
  Factory floor. Worker + sensors + QA approvals.
```

---

## ⚠️ LOCKED ARCHITECTURE — Do Not Revisit

### The Three Parts

```
PART 1 — FRONTEND (React + Next.js 15)
  Canvas Designer + ENB Worker Shell + Manager Dashboard
          ↕ REST / WebSocket (Socket.io)
PART 2 — FASTIFY GATEWAY (thin messenger only)
  5 jobs only — see below. Zero business logic.
          ↕ Temporal client calls
PART 3 — TEMPORAL.IO (owns everything)
  Calls workers. Manages state. Handles waiting.
          ↕ Activity calls
PART 4 — DEDICATED WORKERS (one job each)
  Form · Approval · DB · Notif · AI · MQTT · Report...
```

### Fastify — Exactly 5 Jobs. Nothing More.

```
1. Authenticate JWT via Keycloak
2. Start a Temporal workflow
3. Send a signal to Temporal (submit, approve, reject, stop)
4. Query Temporal for current workflow status
5. Serve WebSocket connections (Socket.io)
```

Fastify never talks to the DB directly.
Fastify never runs business logic.
Fastify never coordinates workers.
It is a pure messenger between frontend and Temporal.

**NestJS was considered and rejected** — too heavy for this role.
**Fastify is confirmed and locked.**

### Temporal Owns Everything

```
Every node = one Temporal activity call = one dedicated worker

The engine:
for (const node of orderedNodes) {
  result = await callWorker(node.type, node.config, context)
  context[node.id] = result   // passed downstream
}

Nodes are config. Workers are code. Temporal is the engine.
```

- Every node in every flow is a Temporal activity call
- Workers are called by Temporal only — never directly by Fastify
- This applies to ALL flow types without exception
- Fastify only starts or signals workflows — never runs them

### Every Step Has Three Phases

```
PHASE 1 — Input         Worker fills all manual fields (frontend only)
PHASE 2 — Approval      Temporal waits for supervisor signal (indefinitely)
PHASE 3 — Unlock        Next step becomes available to worker
```

Worker sees Phase 1 (filling) and Phase 3 (next step).
During Phase 2 they see: "Submitted — awaiting approval."
Temporal handles Phase 2 and Phase 3 always.

### Manual Forms Still Use Temporal

Form filling itself is just frontend — no Temporal for typing.
But approval after submit is ALWAYS Temporal — waits for supervisor signal.

**Full manual form flow:**
```
Worker fills fields → Submit
        ↓
Fastify POST /batches/submit
        ↓
Fastify signals Temporal
        ↓
Temporal → DB Worker saves entry
        ↓
Temporal → Approval Worker starts
        ↓
Temporal WAITS for supervisor signal (indefinitely)
        ↓
Temporal → Notif Worker pushes to supervisor
        ↓
Supervisor approves
        ↓
Fastify POST /batches/approve → signals Temporal
        ↓
Temporal advances to next node
        ↓
Form Worker serves next step to ENB screen
```

---

## 🧠 Core Platform Concept — Flow-to-Node Conversion

> **The single most powerful idea in this platform.**
> Any flow a designer builds can be published as a node.
> That node appears in the palette. Any other flow drags and drops it.

```
Designer builds "Supplier Retrieval Flow"
        ↓
Publishes it as a node
        ↓
Appears in node palette
        ↓
Any flow drags and drops it — black box
        ↓
Temporal runs it as a child workflow internally
        ↓
Parent flow receives result, continues
```

### Four Node Categories

```
CATEGORY 1 — System Nodes
  Built by platform. Ship by default.
  Form, Approval, DB Read, DB Write, Notif, Timer, AI, MQTT, Payment...

CATEGORY 2 — Master Data Nodes
  Auto-generated from master data flows.
  One node per entity: Supplier Retrieval, Variety Lookup, Machine Specs...

CATEGORY 3 — Flow Nodes
  Designer creates a flow → publishes as node → reusable across org
  Versioned: v1, v2, v3

CATEGORY 4 — Composite Nodes
  Nodes made of nodes. Complete black box. Drag, configure, done.
```

### Master Data Is Always A Flow

```
Read    → child flow node    → returns data to parent
Write   → flow with approval → DB Write node after approval
Delete  → flow with approval → soft delete, references preserved
Create  → flow with validation → new record via governance
```

No direct DB access from any flow. All master data goes through flow nodes.

### How Temporal Handles Flow Nodes

```typescript
if (node.type === "flow_node") {
  const result = await executeChildWorkflow(
    node.config.flowId,
    { input: context[node.id] }
  )
  context[node.id] = result
}
```

### Select Field Options Come From Flow Nodes

```
Field: Variety (select)
Options source: Variety Lookup Node
        ↓
Temporal calls child workflow on step load
        ↓
Returns active variety list
        ↓
Frontend renders live dropdown
```

No hardcoded options. No direct DB calls from frontend.

---

## Tech Stack — MIT/Apache 2.0 Only. Locked.

> Rule: No AGPL. No SSPL. No commercial licence risk. Ever.

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript + Next.js 15 |
| Canvas base | Activepieces MIT fork (never touch `ee/`) |
| Canvas engine | React Flow (xyflow) |
| UI components | shadcn/ui |
| Styling | Tailwind CSS |
| State | Zustand |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Real-time | Socket.io client |
| Live sensors | MQTT.js over WebSocket |

### Backend + Orchestration
| Layer | Technology |
|---|---|
| Workflow engine | Temporal.io |
| API gateway | **Fastify** ✅ LOCKED (not NestJS) |
| WebSocket | Socket.io |
| Auth | Keycloak |
| Validation | Zod |
| ORM | Prisma |

### Workers (Node.js TypeScript unless noted)
| Worker | Purpose |
|---|---|
| Form Worker | Serve step UI, wait for submit signal |
| Approval Worker | Hold Temporal signal wait for supervisor |
| DB Worker | All PostgreSQL reads/writes |
| Notif Worker | WebSocket push, email, SMS |
| AI Worker | Claude API — decisions, validation, generation |
| MQTT Worker | Sensor subscribe, actuator publish |
| Auth Worker | JWT, RBAC, Keycloak |
| Logic Worker | Conditions, branches, parallel |
| Timer Worker | Sleep, SLA escalations |
| Report Worker | PDF generation (Python + WeasyPrint) |
| Python Worker | Yield calc, statistics, ML |
| Payment Worker | Razorpay / Stripe |
| OTP Worker | Twilio OTP |
| Storage Worker | SeaweedFS S3 |
| Signature Worker | OpenSign |
| REST Worker | External HTTP calls |
| Webhook Worker | POST context to external URL |
| Integration Worker | Slack, Jira, SAP, Tally |
| Quantum Worker | Qiskit + AWS Braket (Phase 6 only) |

### Data Layer
| Layer | Technology |
|---|---|
| Primary DB | PostgreSQL |
| Time-series | TimescaleDB |
| Cache | Valkey (Apache 2.0 — replaces Redis) |
| File storage | SeaweedFS (Apache 2.0 — replaces MinIO) |

### IIoT Layer
| Layer | Technology |
|---|---|
| MQTT broker | Mosquitto |
| Edge gateway | Node-RED on Raspberry Pi |
| Protocol bridge | Node-RED Modbus plugin |

### DevOps
| Layer | Technology |
|---|---|
| Containers | Docker + Docker Compose |
| Deployment | Coolify |
| CI/CD | GitHub Actions |
| Reverse proxy | Caddy |
| Monitoring | Grafana + Prometheus |
| Logs | Loki |

### Replaced (never use these)
| Old | Reason | Replacement |
|---|---|---|
| MinIO | Community edition dead Dec 2025 | SeaweedFS |
| Redis | SSPL licence 2024 | Valkey |
| DocuSeal | AGPL 3.0 | OpenSign |
| NestJS | Too heavy for gateway role | Fastify |

---

## Minimum Database Schema (POC)

```sql
-- organisations (multi-tenant)
id, name, slug, keycloak_realm, temporal_namespace, db_schema

-- flows
id, org_id, name, version, nodes JSONB, status, published_at

-- batches
id, org_id, lot_id, flow_id, worker_id, status, started_at

-- batch_entries
id, batch_id, node_id, field_values JSONB, status, submitted_at

-- approval_requests
id, batch_id, node_id, status, requested_at, decided_by, decided_at, decision

-- notifications
id, to_user_id, type, batch_id, message, read, created_at
```

---

## Fastify API Endpoints (complete list)

```
GET  /health                         → liveness check

POST /batches/start                  → start Temporal workflow, return lot_id
     body: { flowId, workerId }
     returns: { lotId, workflowId }

POST /batches/:lotId/submit          → signal Temporal with field values
     body: { nodeId, fieldValues }

POST /batches/:lotId/approve         → signal Temporal approval decision
     body: { nodeId, decision: approved|rejected, reason? }

GET  /batches/:lotId/status          → query Temporal workflow state

GET  /flows/assigned                 → flows assigned to current worker's role

WS   /socket.io                      → real-time step push to ENB screen
```

---

## ENB Mode Rules

- Full-screen, tablet-first (10-inch, 48px min touch targets)
- Worker sees ONE step at a time — never the canvas
- Left sidebar: step progress (done ✓ / current → / pending ○)
- All manual input — worker types every field
- Out-of-range: ValidationBanner → block or flag per node config
- Waiting screen during approval phase
- Offline capable: 8 hours without connectivity, syncs on restore
- Each run = one Batch with unique Lot ID (e.g. TUR-2026-0041)

### Manual Field Input Types

```
text         → free type
number       → numeric with min / max validation
select       → fixed options (from static list or flow node)
multi-select → pick one or more
toggle       → yes / no
date         → date picker
textarea     → long notes
```

Select options come from either:
1. Static list defined by designer in node config
2. Master data flow node (live, always current)
3. Dependent on previous field value (conditional options)

---

## Multi-Tenant Architecture

```
Organisation A
  ├── Keycloak realm: org-a
  ├── Temporal namespace: org-a
  ├── PostgreSQL schema: tenant_org_a
  └── SeaweedFS bucket: org-a

Organisation B
  ├── Keycloak realm: org-b
  ├── Temporal namespace: org-b
  ├── PostgreSQL schema: tenant_org_b
  └── SeaweedFS bucket: org-b
```

**Strategy**: Schema-per-tenant on one PostgreSQL instance.
Scales to 500+ tenants on one DB.

### RBAC Roles (per tenant)
| Role | Key Permissions |
|---|---|
| Designer | Build canvas, publish flows, AI generate |
| Worker | ENB execution only |
| QA Supervisor | Approve/reject, view batches |
| Manager | All view + publish + reports |
| IIoT Admin | Sensor config, MQTT binding |
| Org Admin | User management, billing |
| Platform Admin | All orgs — support only |

---

## Two Temporal Workflow Types

### Execution Workflow
- One per batch run
- Follows flow graph node by node
- Triggered by: Worker clicks Start Batch
- Ends when: End node reached
- Workers: Auth, Form, DB, Notif, Approval, Report

### Monitor Workflow
- Runs indefinitely until stopped
- Watches sensor parameters — no human steps
- Triggered by: Designer sets a watch rule
- Three watch types: Threshold, Pattern, Correlation
- Workers: MQTT, AI, Python, Notif, DB

### How They Communicate
```
Monitor fires alert → Temporal SIGNAL → Execution Workflow
Execution pauses current step
Worker sees: "⚠️ Step paused — sensor alert"
Supervisor resolves → Monitor signals Execution → resumes
```

---

## POC Build Order — Start Here

```
WEEK 1 — Fastify + Temporal connected
  Scaffold Fastify project
  Connect Temporal client (temporal:7233)
  Keycloak JWT hook
  GET /health working
  POST /batches/start → starts Temporal workflow
  Confirm: Temporal dashboard shows workflow ✅

WEEK 2 — Form Worker + Socket.io
  Form Worker skeleton registered with Temporal
  Socket.io server on Fastify
  Form Worker pushes step config to ENB via Socket.io
  Frontend renders one hardcoded step with 3 fields
  Worker sees form on screen ✅

WEEK 3 — Submit → Approval → Advance
  POST /batches/:id/submit → signals Temporal
  DB Worker saves batch entry
  Approval Worker waits for signal
  Notif Worker pushes to supervisor
  POST /batches/:id/approve → signals Temporal
  Temporal advances to next node
  Full loop working end to end ✅
```

**POC Flow: Turmeric Intake**
```
Step 1 — Raw Material Entry
  Supplier Name (text), Input Weight (number), Quality Grade (select A/B/C)

Step 2 — Washing Check
  Water Used (number), Duration Minutes (number), Condition (select)

Step 3 — Output Record
  Output Weight (number), Moisture Level (number), Notes (text)
```

---

## Folder Structure

### Current State (as of 2026-04-22)

```
/
├── workflow-frontend/     → Next.js 15 + React Flow canvas + ENB shell
│   └── src/app/           → (auth), (app)/builder, dashboard, run, approvals, admin
├── workflow-backend/      → Fastify gateway (port 4000)
│   ├── src/routes/        → flows, batches, approvals, admin, auth, health
│   ├── src/plugins/       → auth, db, temporal, socketio, keycloak-admin
│   └── prisma/            → schema + 6 migrations
├── workers/               → Temporal workers (monolith — split planned)
│   └── src/               → form/, db/, execution/ activities + workflows
├── docker/                → Docker Compose stack
│   ├── docker-compose.yml → PostgreSQL 16, Keycloak 24, Temporal 1.24, Temporal UI
│   └── init/              → postgres SQL + keycloak realm JSON auto-imports
├── config/                → Runtime service config (outside docker/ — version controlled)
│   └── temporal/
│       └── development-sql.yaml  → Temporal dynamic config
├── data/                  → Persistent Docker volume data (gitignored)
│   ├── postgres/          → PostgreSQL files
│   └── keycloak/          → Keycloak sessions + realms
├── docs/                  → Platform documentation (always update here)
│   └── INFRASTRUCTURE.md
├── .claude/               → Claude Code project permissions and skill settings
│   └── settings.json
├── package.json           → pnpm workspace root
└── pnpm-workspace.yaml    → workspace: workflow-frontend, workflow-backend, workers, packages/*
```

### Target Structure (pending rename)

```
/
├── apps/
│   ├── frontend/          → Next.js 15 + React Flow canvas + ENB shell
│   └── gateway/           → Fastify API server
├── workers/
│   ├── form-worker/       → Form Worker (Node.js + Temporal TS SDK)
│   ├── approval-worker/   → Approval Worker
│   ├── db-worker/         → DB Worker + Prisma
│   ├── notif-worker/      → Notif Worker + Socket.io
│   └── ai-worker/         → AI Worker + Anthropic SDK
├── packages/
│   ├── types/             → shared TypeScript types
│   └── schema/            → Zod schemas shared across apps
├── docker/
│   └── docker-compose.yml → all services
├── docs/                  → all documentation
└── package.json           → pnpm workspace root
```

> Rename `workflow-frontend/` → `apps/frontend/` and `workflow-backend/` → `apps/gateway/`
> is pending. Do not rename until the full split of `workers/` into dedicated workers is ready —
> both renames should happen together in one migration step.

---

## What To Never Do

```
❌ Never add business logic to Fastify
❌ Never let Fastify talk to PostgreSQL directly
❌ Never call a worker directly from Fastify (always via Temporal)
❌ Never use NestJS — decision is locked
❌ Never use Redis (use Valkey), MinIO (use SeaweedFS), DocuSeal (use OpenSign)
❌ Never use AGPL or SSPL licensed packages
❌ Never hardcode select field options — use flow nodes
❌ Never let workers call each other — always go through Temporal
❌ Never skip approval phase — every step submission waits for supervisor
```

---

## Key Mental Models

```
1. Every node = one Temporal activity = one worker
2. Fastify = phone operator (passes messages, does nothing else)
3. Temporal = the brain that never forgets
4. Workers = specialists who do exactly one thing
5. Every flow can become a node (composable process OS)
6. Master data is managed through flows, not admin panels
7. Select options come from flow nodes, not hardcoded lists
8. Approval is always Temporal — never skip it
```
