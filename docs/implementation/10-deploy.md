# 10 · Deploy

Frontend → **Vercel**. Backend monolith (API + worker + MLflow) → **Render**. Postgres → **Render Postgres**. Redis → **Render Key Value**. Artifact bucket → **Cloudflare R2**.

> Railway works identically; substitute their service primitives where you see "Render".

## Dockerize the backend

`backend/Dockerfile`:

```dockerfile
# ── stage 1: build wheel & deps ────────────────────────────────
FROM python:3.11-slim AS deps

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy UV_COMPILE_BYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libpq-dev curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.5.10 /uv /usr/local/bin/uv

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# ── stage 2: copy code ─────────────────────────────────────────
FROM deps AS runtime

COPY athena ./athena
COPY alembic ./alembic
COPY alembic.ini ./

RUN uv sync --frozen --no-dev

# create dirs used by mlflow + local dev fallback
RUN mkdir -p /app/data/mlartifacts /app/data/uploads

ENV PATH="/app/.venv/bin:${PATH}" PYTHONPATH=/app
EXPOSE 8000

# default = API; worker overrides this via Render's start command
CMD ["uvicorn", "athena.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Test locally:

```bash
cd backend
docker build -t athena-backend .
docker run --rm -p 8000:8000 --env-file .env athena-backend
curl localhost:8000/api/health
```

## Render blueprint

`infra/render.yaml`:

```yaml
databases:
  - name: athena-db
    plan: free
    databaseName: athena
    user: athena

services:
  - type: keyvalue          # Render's Redis
    name: athena-redis
    plan: free
    ipAllowList: []         # allow only internal connections

  - type: web
    name: athena-api
    runtime: docker
    plan: starter           # $7/mo — needed for the persistent disk
    repo: https://github.com/fiifidawson/athena
    branch: main
    rootDir: backend
    dockerfilePath: ./Dockerfile
    healthCheckPath: /api/health
    disk:
      name: athena-data
      mountPath: /app/data
      sizeGB: 1
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: athena-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: athena-redis
          type: keyvalue
          property: connectionString
      - key: MLFLOW_TRACKING_URI
        value: sqlite:////app/data/mlflow.db
      - key: MLFLOW_ARTIFACT_ROOT
        value: /app/data/mlartifacts
      - key: ALLOWED_ORIGINS
        value: https://athena-gilt-ten.vercel.app
      - key: S3_ENDPOINT_URL
        sync: false          # set in dashboard
      - key: S3_BUCKET
        sync: false
      - key: S3_ACCESS_KEY
        sync: false
      - key: S3_SECRET_KEY
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: MAIL_FROM
        value: athena@yourdomain.com
      - key: SENTRY_DSN
        sync: false

  - type: worker
    name: athena-worker
    runtime: docker
    plan: starter           # share the disk with api
    repo: https://github.com/fiifidawson/athena
    branch: main
    rootDir: backend
    dockerfilePath: ./Dockerfile
    dockerCommand: arq athena.worker.WorkerSettings
    disk:
      name: athena-data     # mount the same disk so MLflow sqlite + artifacts are shared
      mountPath: /app/data
      sizeGB: 1
    envVars:
      - fromGroup: athena-shared
```

!!! warning "Disk sharing"
    Render's `starter` plan supports persistent disks, but **disks cannot be shared between services** out of the box. If you need the API and worker to share files, you have two options:
    1. **Recommended**: Use R2/S3 for artifacts (`MLFLOW_ARTIFACT_ROOT=s3://...` via boto3 plugin) and Postgres as the MLflow tracking backend. No shared disk needed.
    2. Run a single process that runs both `uvicorn` + `arq` (use `honcho` or a small `start.sh`) — fine until the worker eats all the API's CPU.

    For prod, **do option 1**. Update the env to:

    ```yaml
    - key: MLFLOW_TRACKING_URI
      value: postgresql://athena:...@athena-db/athena_mlflow
    - key: MLFLOW_ARTIFACT_ROOT
      value: s3://athena-artifacts
    ```

    And create the `athena_mlflow` DB:
    ```bash
    # via Render shell
    psql $DATABASE_URL -c "CREATE DATABASE athena_mlflow;"
    ```

## Cloudflare R2 setup

1. <https://dash.cloudflare.com> → **R2** → Create bucket `athena-artifacts`.
2. **Manage R2 API Tokens** → Create with **Object Read & Write** scoped to that bucket.
3. Copy: Access Key ID, Secret Access Key, Endpoint (`https://<account>.r2.cloudflarestorage.com`).
4. In Render, paste into `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT_URL`, `S3_BUCKET`.

## Deploy backend

```bash
git add infra/render.yaml backend/
git commit -m "feat: render deploy config"
git push origin main
```

Then in Render:

- **New +** → **Blueprint** → connect repo → pick `infra/render.yaml` → Apply.
- First deploy takes ~5 min (Docker build). Watch the logs tab.
- After deploy, **manually** SSH into the API service and run migrations:

```bash
# Render dashboard → athena-api → Shell
alembic upgrade head
```

Or add it as a pre-deploy command in `render.yaml` once you've verified it works:

```yaml
preDeployCommand: alembic upgrade head
```

## Vercel: frontend

1. <https://vercel.com/new> → import the repo → Root directory: `frontend`.
2. Framework preset: **Vite** (auto-detected).
3. Environment variables:
   - `VITE_API_URL` = your Render URL, e.g. `https://athena-api.onrender.com`
4. Deploy.

## Wire the two together

After both are up:

| Setting | Where | Value |
|---|---|---|
| `ALLOWED_ORIGINS` | Render → athena-api | `https://your-vercel-url.vercel.app` (no trailing slash) |
| `VITE_API_URL` | Vercel | `https://athena-api.onrender.com` |
| Magic-link origin | falls out of the `Origin` request header — no config needed |

After updating env vars in Render, click **Manual Deploy** to restart.

## Custom domain (optional)

- Buy `athena.bio` or whatever.
- In Vercel: Settings → Domains → add `athena.bio` (Vercel gives you DNS records).
- In Render: athena-api → Settings → Custom Domains → add `api.athena.bio`.
- Update `ALLOWED_ORIGINS=https://athena.bio` and `VITE_API_URL=https://api.athena.bio`. Redeploy both.
- Don't forget to re-run the OG image generator + index.html update (page references your earlier work) for the new domain.

## CI

`.github/workflows/backend.yml`:

```yaml
name: backend

on:
  pull_request:
    paths: ["backend/**", ".github/workflows/backend.yml"]
  push:
    branches: [main]
    paths: ["backend/**", ".github/workflows/backend.yml"]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: athena
          POSTGRES_PASSWORD: athena
          POSTGRES_DB: athena
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    env:
      DATABASE_URL: postgresql+asyncpg://athena:athena@localhost:5432/athena
      REDIS_URL: redis://localhost:6379/0
      SECRET_KEY: ci-test-secret-key-do-not-use-in-prod
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
        with: { version: "0.5.10" }
      - run: uv sync --frozen
        working-directory: backend
      - run: uv run alembic upgrade head
        working-directory: backend
      - run: uv run ruff check .
        working-directory: backend
      - run: uv run pytest -q
        working-directory: backend
```

`.github/workflows/frontend.yml`:

```yaml
name: frontend

on:
  pull_request:
    paths: ["frontend/**"]
  push:
    branches: [main]
    paths: ["frontend/**"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
```

## Definition of done

- [ ] `https://your-vercel-url.vercel.app` loads and lets you request a magic link.
- [ ] The magic link redirects to `/app` (no CORS error in DevTools console).
- [ ] A run created on prod shows up in the prod MLflow UI (after you've gated `/mlflow` behind admin auth — see [page 07's warning](07-mlflow.md#mount-mlflow-under-mlflow)).
- [ ] CI is green on `main`.

Next: **[11 · Observability →](11-observability.md)**
