# Infrastructure Guide

All infrastructure services run from the `docker/` folder using Docker Compose.
Persistent data is stored **outside** the `docker/` folder in `data/` at the repo root — it is never deleted on container restart or rebuild.

## Services

| Service      | Port | URL                           | Purpose                  |
|--------------|------|-------------------------------|--------------------------|
| PostgreSQL   | 5432 | `postgresql://localhost:5432` | Primary database         |
| Keycloak     | 8080 | http://localhost:8080         | Auth, RBAC, multi-tenant |
| Temporal     | 7233 | `localhost:7233` (gRPC)       | Workflow orchestration   |
| Temporal UI  | 8088 | http://localhost:8088         | Workflow dashboard       |

## Credentials (defaults, override via `docker/.env`)

| Service    | Username | Password     | Database       |
|------------|----------|--------------|----------------|
| PostgreSQL | `elb`    | `elb_secret` | `elb_platform` |
| Keycloak   | `admin`  | `admin123`   | —              |

## Folder Layout

```
/ (repo root)
├── data/                      ← persistent Docker volume data (gitignored)
│   ├── postgres/              ← PostgreSQL data files
│   └── keycloak/              ← Keycloak sessions and realms
├── config/                    ← runtime config for all services
│   └── temporal/
│       └── development-sql.yaml  ← Temporal dynamic config
└── docker/
    ├── docker-compose.yml     ← mounts ../data/* and ../config/temporal
    └── init/
        ├── postgres/          ← *.sql files auto-run on first PostgreSQL start
        └── keycloak/          ← realm JSON files auto-imported on Keycloak start
```

> `data/` and `config/` both sit at the repo root — outside `docker/` — so they are never
> accidentally deleted when tearing down or rebuilding the Docker stack. Docker mounts them
> via relative `../` paths from `docker/docker-compose.yml`.

## Commands

```bash
# Start all services (from repo root)
pnpm infra:up

# Or directly from docker/ folder
cd docker && docker compose up -d

# Start specific services only
docker compose up -d postgres keycloak
docker compose up -d temporal temporal-ui

# View logs
docker compose logs -f temporal
docker compose logs -f keycloak

# Stop all (data in data/ is preserved)
docker compose down

# Stop and DELETE all data (irreversible — deletes data/ contents)
docker compose down -v

# Connect to PostgreSQL
psql postgresql://elb:elb_secret@localhost:5432/elb_platform
```

## First-Time Keycloak Setup

1. Start services: `pnpm infra:up`
2. Open http://localhost:8080
3. Login with `admin` / `admin123`
4. Create realm: `elb-platform`
5. Create client: `workflow-backend` (type: Bearer-only)
6. Add roles: `Designer`, `Worker`, `Supervisor`, `Manager`, `OrgAdmin`, `PlatformAdmin`
7. Create a test user and assign a role

Or drop a realm export JSON into `docker/init/keycloak/` — it auto-imports on next start.

## Connecting the Backend

Update `workflow-backend/.env`:

```env
DATABASE_URL=postgresql://elb:elb_secret@localhost:5432/elb_platform
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=elb-platform
KEYCLOAK_CLIENT_ID=workflow-backend
TEMPORAL_ADDRESS=localhost:7233
```
