# ELB Platform — Docker Infrastructure

All infrastructure services run from this folder.

## Services

| Service       | Port  | URL                         | Purpose                     |
|---------------|-------|-----------------------------|-----------------------------|
| PostgreSQL    | 5432  | `postgresql://localhost:5432` | Primary database           |
| Keycloak      | 8080  | http://localhost:8080       | Auth, RBAC, multi-tenant    |
| Temporal      | 7233  | `localhost:7233` (gRPC)     | Workflow orchestration      |
| Temporal UI   | 8088  | http://localhost:8088       | Workflow dashboard          |

## Data persistence

All data lives in `./data/` — **never deleted on container restart or rebuild**.

```
docker/
├── data/
│   ├── postgres/      ← PostgreSQL data files
│   └── keycloak/      ← Keycloak data (sessions, realms)
├── init/
│   ├── postgres/      ← SQL files auto-run on first start (*.sql)
│   └── keycloak/      ← Realm JSON files auto-imported on start
└── config/
    └── temporal/      ← Temporal dynamic config YAML
```

## Commands

```bash
# Start all services
docker compose up -d

# Start only specific services
docker compose up -d postgres keycloak
docker compose up -d temporal temporal-ui

# View logs
docker compose logs -f temporal
docker compose logs -f keycloak

# Stop all (data preserved)
docker compose down

# Stop and DELETE all data (irreversible)
docker compose down -v

# Connect to PostgreSQL
psql postgresql://elb:elb_secret@localhost:5432/elb_platform
```

## First-time Keycloak setup

1. Start services: `docker compose up -d`
2. Open http://localhost:8080
3. Login with `admin` / `admin123`
4. Create realm: `elb-platform`
5. Create client: `apps/gateway` (type: Bearer-only)
6. Add roles: `Designer`, `Worker`, `Supervisor`, `Manager`, `OrgAdmin`, `PlatformAdmin`
7. Create a test user and assign a role

Or drop a realm export JSON into `init/keycloak/` — it auto-imports on next start.

## Connecting apps/gateway

Update `apps/gateway/.env`:
```env
DATABASE_URL=postgresql://elb:elb_secret@localhost:5432/elb_platform
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=elb-platform
KEYCLOAK_CLIENT_ID=apps/gateway
```
