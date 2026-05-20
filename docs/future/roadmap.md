# Roadmap

Bigger swings beyond the local-first port. Sorted roughly by impact.

## Near-term (next 6 months after cloud launch)

### Model registry

Once users have trained 10+ models, "where's the best one I trained?" becomes the killer question. MLflow has a model registry built in — surface it in the Athena UI:

- A `/app/models` page listing registered models (version, stage = staging/production, owner).
- A "Promote to production" button on a run's detail page that calls `MlflowClient.transition_model_version_stage`.
- API endpoint for downstream apps to pull the latest production model.

### Hyperparameter optimization (Optuna)

Already a dep in [page 01](../implementation/01-repo-layout.md). Wire it up:

- New "AutoML" toggle on the dashboard. When on, replace `Hyperparameters` form with `Search Space` (ranges per param).
- `core/hpo.py` runs Optuna trials, each as a child arq job tagged with the parent study id.
- UI shows the parallel-coordinates and slice plots Optuna gives you for free.

### Dataset versioning

Same dataset uploaded twice with one row different = two separate datasets is dumb. Hash the contents on upload, dedupe, and version (`my_data:v3`). DVC for the artifact backing.

### Multi-tenancy / workspaces

Right now every user is a tenant of one. Add a `Workspace` between `User` and everything else: users belong to workspaces, datasets/runs/models belong to workspaces. Standard pattern — do not over-engineer.

## Medium-term (6–12 months)

### GPU jobs via Modal / Runpod

Render doesn't do cheap GPUs. Offload training jobs that need a GPU to [Modal](https://modal.com):

- A new `arq` job kind: `train_gpu`.
- The job submits a Modal function call, polls for status, streams logs back via Modal's API.
- User pays — Athena passes through usage with a small margin or charges a flat subscription.

### Plugin SDK

A way for third parties (academic labs, biotech teams) to ship custom:

- Featurizers (e.g., a lab's proprietary descriptor)
- Model architectures
- Evaluation metrics

Probably a Python entry-points-based plugin system loaded at backend startup. Sandbox per plugin (subprocess, not import). Decide a security model **before** shipping this — running arbitrary Python on shared infra is dangerous.

### REST API for downstream apps

Today the API is "the frontend." Polish it into a public API with API keys, rate limits, OpenAPI spec hosted at `/api/docs`. Lab teams want to integrate trained models into their own ELN systems.

## Long-term (12 months+)

### Mobile companion

Read-only. Tap a notification → see a run's loss curve and final metrics → approve "promote to prod." Push notifications via [Expo](https://expo.dev). Doesn't need to be a fully separate app for years.

### Foundation-model fine-tuning

Now-mainstream models for chemistry (ChemBERTa, MolFormer, Geom3D) take Athena from "AutoML" toward "fine-tune any chemistry FM in 3 clicks." This is the conversation that turns hobbyists into paying biotechs.

### On-prem distribution

Big pharma can't use Vercel + Render. Ship an OCI bundle (Helm chart + Postgres + Redis + MinIO + the same backend image) that customers run in their own cluster. Charge for support.

## Explicitly **not** on the roadmap

- ❌ A drag-and-drop workflow editor (Kubeflow Pipelines style). Massive scope, narrow audience, almost always abandoned.
- ❌ A custom chemistry-aware programming language. We already have Python.
- ❌ Realtime collaboration (Figma-style cursors). Drug discovery isn't a multiplayer activity at the run-config level.
- ❌ A separate "Athena Cloud" SaaS product disjoint from the OSS core. Either everyone runs the same code or no one trusts the OSS version.
