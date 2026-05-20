# Implementation Playbook

You are about to build Athena from an empty `backend/` folder to a deployed monolith on Render with the frontend on Vercel. Twelve pages. Do them in order.

## Mental model first

Athena has **three** moving parts:

1. **FastAPI HTTP API** — handles requests, returns JSON, mounts the MLflow tracking UI under `/mlflow`.
2. **arq worker** — same Python codebase, different process. Pulls jobs (training runs, dataset preprocessing) off Redis and executes them. Long-running work never blocks the API.
3. **Frontend SPA** — Vite/React. In dev, talks to `http://localhost:8000`. In prod, deployed on Vercel and talks to your Render URL.

In **dev** you run all three locally (`uvicorn`, `arq`, `npm run dev`). In **prod** the API and the worker run in the same Render container under two `Procfile`-style commands; the frontend is a static deploy on Vercel.

## Feature set the playbook builds

| Feature | Page | Why we build it manually |
|---|---|---|
| HuggingFace model/dataset picker (with HF token) | [08](08-huggingface.md) | You need to understand the auth flow + gated-model handling; libraries abstract it away. |
| MLflow experiment tracking (self-hosted) | [07](07-mlflow.md) | Hosted MLflow ($$$) isn't necessary at this stage; sqlite + R2 is fine. |
| Code-snippet recorder (every UI action → Python you can copy) | [06](06-code-snippets.md) | This is Athena's USP. Has to be built from scratch. |
| Background training jobs with SSE progress | [05](05-jobs.md) | Foundation for the whole product. |
| Magic-link auth + JWT sessions | [04](04-auth.md) | Passwords are not worth the support burden for an MVP. |

## Suggested additional features (decide before page 02)

You only mentioned **MLflow** and **HuggingFace**. Here are five I'd bake into the plan now because retrofitting them later is painful. Skim the list, kill what you don't want, then proceed.

!!! tip "Recommended extras"
    - **RDKit + DeepChem** — molecule featurization (SMILES → fingerprints/graphs). Without this, "drug discovery" is just a tagline.
    - **Optuna** — hyperparameter search. The "Auto" in AutoML.
    - **Cloudflare R2** — S3-compatible artifact storage, 10 GB free tier. MLflow + HF cache both target it.
    - **Sentry** — error tracking. Five-minute setup, saves hours.
    - **PostHog** — product analytics + session replay (free tier). Tells you which features people actually use.

!!! warning "Skip these for now"
    - **Kubernetes / Airflow / Kubeflow** — your old README mentioned these. They're correct *for the right scale*. You don't have that scale yet. Adding them now will delay you by months.
    - **GPU training** — Render/Railway don't offer cheap GPUs. Either restrict the MVP to CPU-friendly models (sklearn, lightgbm, small transformers via HF) or plan a Modal/Runpod integration later. Don't try to provision a GPU on the API host.

## Definition of done (whole playbook)

- [ ] `git clone` a fresh checkout, run two commands, get a working dev environment.
- [ ] `https://athena.example.com` loads the SPA, lets a user sign in, upload a CSV of SMILES + activity, pick an HF base model, train, and see the loss curve update live.
- [ ] Every action shows a "View code" button that opens a side panel of the equivalent Python.
- [ ] An admin can open `https://api.athena.example.com/mlflow` and see every run logged.
- [ ] CI runs lint + tests on PR.

Begin: **[00 · Prerequisites →](00-prerequisites.md)**
