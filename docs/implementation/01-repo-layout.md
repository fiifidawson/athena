# 01 · Repo Layout

We're building a **monolith** in a **single repo**. Two top-level apps (`backend/`, `frontend/`) plus shared infra. No microservices, no monorepo build tools, no package workspaces. Less is more.

## Final layout (memorize this)

```
athena/
├── backend/                    ← FastAPI app + arq worker (same codebase)
│   ├── athena/
│   │   ├── __init__.py
│   │   ├── main.py             ← FastAPI entrypoint
│   │   ├── worker.py           ← arq worker entrypoint
│   │   ├── settings.py         ← pydantic-settings, reads env
│   │   ├── deps.py             ← dependency-injection helpers
│   │   ├── api/                ← HTTP routes (thin)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── datasets.py
│   │   │   ├── models.py
│   │   │   ├── runs.py         ← training run CRUD + SSE
│   │   │   ├── huggingface.py
│   │   │   └── mlflow_proxy.py ← mounts MLflow under /mlflow
│   │   ├── core/               ← domain logic (no HTTP, no DB)
│   │   │   ├── __init__.py
│   │   │   ├── featurize.py    ← SMILES → fingerprints (RDKit)
│   │   │   ├── train.py        ← orchestrates a run
│   │   │   ├── hpo.py          ← Optuna wrapper
│   │   │   └── snippet.py      ← code-snippet recorder
│   │   ├── db/                 ← SQLAlchemy + Alembic
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── models.py       ← User, Dataset, Run, Artifact, Snippet
│   │   ├── schemas/            ← pydantic request/response shapes
│   │   │   ├── __init__.py
│   │   │   └── ...
│   │   ├── integrations/
│   │   │   ├── __init__.py
│   │   │   ├── huggingface.py  ← thin wrapper around huggingface_hub
│   │   │   ├── mlflow_client.py
│   │   │   └── storage.py      ← R2 / local-disk artifact store
│   │   └── jobs/               ← arq job functions
│   │       ├── __init__.py
│   │       └── training.py
│   ├── alembic/                ← migrations
│   ├── alembic.ini
│   ├── tests/
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   ← (already exists — keep as-is for now)
│   └── ...
│
├── docs/                       ← MkDocs source (this site)
├── infra/
│   ├── docker-compose.yml      ← local Postgres + Redis (+ MinIO later)
│   └── render.yaml             ← Render blueprint
├── .github/workflows/
│   ├── backend.yml             ← lint + test on PR
│   ├── frontend.yml
│   └── docs.yml                ← deploy docs to gh-pages
├── mkdocs.yml
├── requirements-docs.txt
├── README.md
├── LICENSE
└── .gitignore
```

## Why this shape

- **`backend/athena/`** is the Python *package*. The repo root is **not** importable; the package is. Cleaner imports (`from athena.core.train import run`), works the same in dev and production.
- **`api/` is thin**, **`core/` is fat**. Routes do nothing except parse, call a `core/` function, and serialize. `core/` doesn't import anything from `api/` or `db/` — pass it data, get data back. This is what makes testing easy.
- **`integrations/`** is a hard boundary. Anything that talks to a third party (HF, MLflow, R2) lives there with a thin façade. The rest of the codebase imports the façade, not the underlying SDK. When HuggingFace changes their API, you change one file.
- **`jobs/` re-uses `core/`**. A job is a one-line wrapper that calls a `core/` function. No business logic in jobs.

## Create the skeleton

From the repo root:

```bash
mkdir -p backend/athena/{api,core,db,schemas,integrations,jobs}
mkdir -p backend/{alembic,tests}
mkdir -p infra

# touch the package init files
for d in athena athena/api athena/core athena/db athena/schemas athena/integrations athena/jobs; do
  : > "backend/$d/__init__.py"
done
```

On Windows PowerShell:

```powershell
$dirs = @(
  "backend/athena/api","backend/athena/core","backend/athena/db",
  "backend/athena/schemas","backend/athena/integrations","backend/athena/jobs",
  "backend/alembic","backend/tests","infra"
)
$dirs | ForEach-Object { New-Item -ItemType Directory -Force $_ | Out-Null }

$inits = @(
  "backend/athena/__init__.py","backend/athena/api/__init__.py",
  "backend/athena/core/__init__.py","backend/athena/db/__init__.py",
  "backend/athena/schemas/__init__.py","backend/athena/integrations/__init__.py",
  "backend/athena/jobs/__init__.py"
)
$inits | ForEach-Object { if (-not (Test-Path $_)) { New-Item -ItemType File $_ | Out-Null } }
```

## `pyproject.toml`

Create `backend/pyproject.toml`:

```toml
[project]
name = "athena"
version = "0.1.0"
description = "AutoML for drug discovery — monolith backend"
requires-python = ">=3.11,<3.12"
dependencies = [
  # web
  "fastapi[standard]==0.115.6",
  "uvicorn[standard]==0.32.1",
  "pydantic==2.10.3",
  "pydantic-settings==2.7.0",
  "python-multipart==0.0.20",

  # db
  "sqlalchemy[asyncio]==2.0.36",
  "alembic==1.14.0",
  "asyncpg==0.30.0",
  "psycopg2-binary==2.9.10",  # alembic uses sync driver
  "aiosqlite==0.20.0",        # for tests

  # jobs
  "arq==0.26.3",
  "redis==5.2.1",

  # auth
  "pyjwt==2.10.1",
  "passlib[bcrypt]==1.7.4",
  "itsdangerous==2.2.0",

  # ml / drug discovery
  "scikit-learn==1.6.0",
  "lightgbm==4.5.0",
  "rdkit==2024.9.4",
  "numpy==2.1.3",
  "pandas==2.2.3",

  # mlflow + hf
  "mlflow==2.19.0",
  "huggingface-hub==0.27.0",
  "datasets==3.2.0",
  "optuna==4.1.0",

  # storage
  "boto3==1.35.84",          # R2 (S3-compatible)

  # observability
  "structlog==24.4.0",
  "sentry-sdk[fastapi]==2.19.2",

  # mail
  "httpx==0.28.1",            # for Resend / generic SMTP-over-HTTP
]

[dependency-groups]
dev = [
  "pytest==8.3.4",
  "pytest-asyncio==0.24.0",
  "pytest-cov==6.0.0",
  "ruff==0.8.4",
  "mypy==1.13.0",
  "httpx==0.28.1",
]

[tool.uv]
package = true

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["athena"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

!!! note "Why pin everything"
    For a learning project you want **reproducibility over upgrade-friendliness**. Pinned deps mean "it worked yesterday, it works today." When you're ready to upgrade, do it deliberately — one library at a time.

## Create the venv

```bash
cd backend
uv sync
```

This creates `backend/.venv/` and installs everything. Verify:

```bash
uv run python -c "import fastapi, sqlalchemy, mlflow, rdkit; print('ok')"
# ok
```

## `.env.example`

Create `backend/.env.example`:

```bash
# ─── runtime ─────────────────────────────────────────────────
ENVIRONMENT=development            # development | staging | production
LOG_LEVEL=INFO

# ─── secrets ─────────────────────────────────────────────────
SECRET_KEY=change-me-to-a-long-random-string
JWT_ALGORITHM=HS256
JWT_TTL_SECONDS=2592000            # 30 days

# ─── database ────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://athena:athena@localhost:5432/athena

# ─── redis (arq) ─────────────────────────────────────────────
REDIS_URL=redis://localhost:6379/0

# ─── mlflow ──────────────────────────────────────────────────
MLFLOW_TRACKING_URI=sqlite:///./data/mlflow.db
MLFLOW_ARTIFACT_ROOT=./data/mlartifacts

# ─── object storage (optional in dev) ────────────────────────
S3_ENDPOINT_URL=                   # e.g. https://<account>.r2.cloudflarestorage.com
S3_BUCKET=athena-artifacts
S3_ACCESS_KEY=
S3_SECRET_KEY=

# ─── huggingface ─────────────────────────────────────────────
HF_TOKEN=                          # optional fallback; per-user tokens preferred

# ─── email (magic links) ─────────────────────────────────────
RESEND_API_KEY=
MAIL_FROM=athena@example.com

# ─── cors ────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:5173,https://athena.example.com

# ─── observability ───────────────────────────────────────────
SENTRY_DSN=
```

Copy it for local dev:

```bash
cp backend/.env.example backend/.env
```

Then fill in `SECRET_KEY` with something random:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## Definition of done

- [ ] Folder skeleton exists at `backend/athena/{api,core,db,schemas,integrations,jobs}`.
- [ ] `backend/pyproject.toml` exists, `uv sync` succeeded.
- [ ] `backend/.env` exists with `SECRET_KEY` set to a random value.
- [ ] `infra/docker-compose.yml` from page 00 is still running.

Next: **[02 · Backend Skeleton →](02-backend-skeleton.md)**
