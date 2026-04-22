# flow-twin

A no-code Industrial Digital Twin Platform — a visual workflow builder where designers build process flows once, workers execute them step by step, and supervisors get notified and approve in real time.

> **Tagline**: Build your factory process once. Your workers execute it. You see everything.

**Market**: Small and mid-size food processing, pharma, spice, and agro-processing factories. Replacing paper SOPs and WhatsApp-based process tracking.

---

## Structure

```
/
├── workflow-frontend/     → Next.js 15 + React Flow canvas + ENB worker shell  [:3000]
├── workflow-backend/      → Fastify API gateway (thin messenger to Temporal)    [:4000]
├── workers/               → Temporal activity workers (form, db, execution)
├── docker/                → Docker Compose stack (PostgreSQL, Keycloak, Temporal)
├── config/                → Runtime config for all services (outside docker/)
│   └── temporal/          → Temporal dynamic config YAML
├── data/                  → Persistent Docker volumes (gitignored — never deleted)
│   ├── postgres/          → PostgreSQL data files
│   └── keycloak/          → Keycloak realms and sessions
├── docs/                  → Platform documentation
├── .claude/               → Claude Code project settings and skill permissions
└── packages/              → Shared TypeScript types and Zod schemas (planned)
```

## Stack

| Layer         | Technology                         |
|---------------|------------------------------------|
| Frontend      | React 19 + Next.js 15 + React Flow |
| API Gateway   | Fastify (port 4000)                |
| Orchestration | Temporal.io (gRPC :7233)           |
| Auth          | Keycloak (port 8080)               |
| Database      | PostgreSQL 16 + Prisma             |
| Real-time     | Socket.io                          |
| Containers    | Docker + Docker Compose            |

## Services

| Service      | URL                   | Credentials      |
|--------------|-----------------------|------------------|
| Frontend     | http://localhost:3000 | —                |
| API Gateway  | http://localhost:4000 | —                |
| Temporal UI  | http://localhost:8088 | —                |
| Keycloak     | http://localhost:8080 | admin / admin123 |
| PostgreSQL   | localhost:5432        | elb / elb_secret |

---

## Prerequisites

```bash
node --version          # v20+ required
pnpm --version          # v8+ required  (npm install -g pnpm)
docker --version        # v24+ required
docker compose version  # v2.20+ required
```

---

## Step 1 — Clone and Install

```bash
git clone https://github.com/jhankar1/flow-twin.git
cd flow-twin
pnpm install
```

---

## Step 2 — Infrastructure

Persistent data lives in `data/` at the repo root (gitignored). Docker mounts it via `../data/postgres` and `../data/keycloak` relative to `docker/docker-compose.yml`.

```bash
# Start PostgreSQL, Keycloak, Temporal, Temporal UI
pnpm infra:up

# Verify
cd docker && docker compose ps
```

Expected:
```
NAME               STATUS
elb-postgres       running
elb-keycloak       running
elb-temporal       running
elb-temporal-ui    running
```

> Keycloak takes ~60 seconds to be fully ready.

---

## Step 3 — Keycloak Setup (first time only)

1. Open http://localhost:8080 → login with `admin` / `admin123`
2. Create realm: `elb-platform`
3. Create client: `workflow-backend` (type: Bearer-only)
4. Add roles: `Designer`, `Worker`, `Supervisor`, `Manager`, `OrgAdmin`, `PlatformAdmin`
5. Create a test user, assign the `Worker` role

Or drop a realm export JSON into `docker/init/keycloak/` — it auto-imports on next start.

---

## Step 4 — Backend (Fastify Gateway)

```bash
cd workflow-backend
cp .env.example .env
```

Edit `workflow-backend/.env`:

```env
DATABASE_URL=postgresql://elb:elb_secret@localhost:5432/elb_platform
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=elb-platform
KEYCLOAK_CLIENT_ID=workflow-backend
TEMPORAL_ADDRESS=localhost:7233
FRONTEND_URL=http://localhost:3000
```

```bash
npx prisma migrate dev   # first time only
pnpm dev
```

Verify: `GET http://localhost:4000/health` → `{ "status": "ok" }`

---

## Step 5 — Workers

```bash
cd workers
```

Edit `workers/.env`:

```env
DATABASE_URL=postgresql://elb:elb_secret@localhost:5432/elb_platform
TEMPORAL_ADDRESS=localhost:7233
API_URL=http://localhost:4000
```

```bash
pnpm dev
```

---

## Step 6 — Frontend

```bash
cd workflow-frontend && pnpm dev
```

---

## Full Dev Session (4 terminals)

```bash
# Terminal 1 — infra (one-time, leave running)
pnpm infra:up

# Terminal 2 — backend gateway
cd workflow-backend && pnpm dev

# Terminal 3 — workers
cd workers && pnpm dev

# Terminal 4 — frontend
cd workflow-frontend && pnpm dev
```

---

## Test the POC Flow

```bash
# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test-worker", "password": "password"}'

# Start a batch
curl -X POST http://localhost:4000/batches/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"flowId": "flow-001", "workerId": "worker-001"}'
# → { "lotId": "TUR-2026-0041", "workflowId": "..." }
```

1. Open http://localhost:3000/run/TUR-2026-0041 — ENB step appears
2. Fill fields → Submit → Temporal pauses for approval
3. Open http://localhost:3000/approvals → approve → Temporal advances

---

## POC Flow — Turmeric Intake

```
Step 1 — Raw Material Entry   → Supplier Name (text), Input Weight (number), Quality Grade (select A/B/C)
Step 2 — Washing Check        → Water Used (number), Duration Minutes (number), Condition (select)
Step 3 — Output Record        → Output Weight (number), Moisture Level (number), Notes (text)
```

Each step: Worker fills → Submits → Supervisor approves → Temporal advances → Next step unlocks.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Temporal won't start | Wait for postgres to be healthy: `docker compose ps` |
| Worker can't connect to Temporal | Check `TEMPORAL_ADDRESS=localhost:7233` in `workers/.env` |
| WebSocket not connecting | Check `FRONTEND_URL` in `workflow-backend/.env` matches `http://localhost:3000` |
| Prisma migration fails | Check `DATABASE_URL` uses `elb/elb_secret/elb_platform` |
| Keycloak 502 on start | Keycloak starts slow — wait 60s, then: `docker compose logs -f keycloak` |
| Form not appearing on ENB | Verify `workerId` matches in socket auth and the batch start request |

---

## Next Steps

```
Week 4   Split workers/ monolith into dedicated workers (form-worker/, db-worker/, etc.)
Week 5   Notif Worker — push approval requests to supervisor via WebSocket
Week 6   Chain multiple nodes — full multi-step flow end-to-end
Week 7   Master data flows — Supplier, Variety lookup nodes
Week 8   packages/ — extract shared types and Zod schemas
```

See [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) for full Docker reference and data persistence details.
