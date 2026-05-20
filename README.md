<div align="center">

<img src="frontend/public/logo.svg" alt="Athena" width="120" />

# athena

**AutoML for drug discovery — in your browser, no Python required.**

End-to-end pipeline from data selection to benchmarking. Every action shows you the equivalent Python you'd write yourself.

[![Status](https://img.shields.io/badge/status-pre--alpha-orange?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-mkdocs-0ea5e9?style=flat-square)](https://fiifidawson.github.io/athena/)
[![Frontend](https://img.shields.io/badge/frontend-vercel-black?style=flat-square)](https://athena-gilt-ten.vercel.app/)

[**Live demo →**](https://athena-gilt-ten.vercel.app/) &nbsp;·&nbsp; [**Docs →**](https://fiifidawson.github.io/athena/) &nbsp;·&nbsp; [**Implementation playbook →**](https://fiifidawson.github.io/athena/implementation/)

</div>

---

## What is Athena?

Athena is an open-source web platform that automates the boring parts of building ML models for drug discovery — dataset curation, featurization, model selection, hyperparameter search, evaluation — and shows you the Python code for every step so you actually learn what's happening underneath.

It's aimed at:

- **Wet-lab scientists** who have CSVs of molecules + activity and want a baseline model without learning scikit-learn first.
- **CS students** who want to see real drug-discovery ML without setting up RDKit on their laptop.
- **Biotech ML teams** who need a fast prototyping environment before committing to a production pipeline.

> ⚠️ **Pre-alpha.** The landing page is live; the application is being built per the [implementation playbook](https://fiifidawson.github.io/athena/implementation/). Star the repo to follow along.

## Architecture at a glance

```
┌──────────────────────┐   HTTPS    ┌────────────────────────────────────┐
│  React 19 SPA        │ ─────────► │  FastAPI monolith (Render)         │
│  (Vercel)            │ ◄───────── │   ├── /api      REST + SSE         │
└──────────────────────┘            │   ├── /mlflow   tracking UI        │
                                    │   └── arq worker (same image)      │
                                    └────────────────────────────────────┘
                                              │           │
                                              ▼           ▼
                                       ┌──────────┐  ┌──────────┐
                                       │ Postgres │  │ R2 / S3  │
                                       └──────────┘  └──────────┘
```

Single repo, single deploy pipeline. See the [implementation docs](https://fiifidawson.github.io/athena/implementation/01-repo-layout/) for the full layout.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 8, Tailwind v4, TanStack Router + Query, Framer Motion, Shiki |
| Backend | FastAPI, SQLAlchemy 2, Alembic, arq (Redis), structlog |
| ML | RDKit, scikit-learn, LightGBM, HuggingFace Hub, MLflow, Optuna |
| Infra | Render (API + worker + Postgres + Redis), Vercel (SPA), Cloudflare R2 (artifacts) |

## Quickstart (local dev)

Prereqs: Python 3.11, Node 20+, Docker, [uv](https://docs.astral.sh/uv/), `mkdocs`.

```bash
git clone https://github.com/fiifidawson/athena.git
cd athena

# 1. local services
docker compose -f infra/docker-compose.yml up -d

# 2. backend (terminal 1)
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn athena.main:app --reload

# 3. worker (terminal 2)
cd backend
uv run arq athena.worker.WorkerSettings

# 4. frontend (terminal 3)
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

Full setup walkthrough: [implementation/00 → 02](https://fiifidawson.github.io/athena/implementation/00-prerequisites/).

## Documentation

The docs site is the source of truth for **how to build, run, and extend Athena**.

```bash
# preview docs locally
pip install -r requirements-docs.txt
mkdocs serve
# open http://127.0.0.1:8000
```

Two top-level sections:

- **[Implementation](https://fiifidawson.github.io/athena/implementation/)** — twelve sequential pages taking you from empty repo to deployed monolith. Every command. Every file. Written as a staff engineer briefing a junior.
- **[Future](https://fiifidawson.github.io/athena/future/)** — design notes for the local-first Tauri desktop port and the longer-term roadmap.

## Contributing

PRs welcome once the implementation playbook reaches "Definition of done" for all twelve pages. Until then, the highest-leverage contributions are:

- 🐛 Filing issues for things in the docs that don't match the code.
- 📝 Proposing additions/edits to the docs themselves — they're in `docs/` and built with MkDocs Material.
- 🧪 Adding integration tests for backend modules as they land.

### Commit convention

```
feat:     a new feature
fix:      a bug fix
docs:     documentation only
style:    formatting only (no logic change)
test:     adding or fixing tests
chore:    deps, configs, tooling
perf:     performance improvement
ci:       CI/CD changes
build:    build / external dependencies
revert:   revert a previous commit
```

## License

[Apache 2.0](LICENSE).
