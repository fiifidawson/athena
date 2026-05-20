# 07 · MLflow (Manual)

What "manual" means here: we don't use Databricks-hosted MLflow. We **embed** the MLflow tracking server inside our own FastAPI process and call its Python client directly from our jobs. SQLite stores run metadata; R2 (S3-compatible) stores model artifacts.

## What we get

- Every Athena `Run` gets a corresponding MLflow `run` with params, metrics, model artifact.
- Admins can browse `/mlflow` in the browser to inspect any run.
- Users get back an `mlflow_run_id` so the UI can link straight to the relevant page.

## Tracking backend choice

| Backend | Use when |
|---|---|
| `sqlite:///./data/mlflow.db` | Dev, tiny installs (single container). Default in our `.env.example`. |
| `postgresql://...` | Prod when you outgrow sqlite (~1M runs). Re-use the Athena Postgres with a separate DB. |
| Managed Databricks | Don't bother for this project. |

For deploy on Render with persistent disk: stick with sqlite + disk-mounted artifact root. For Render without disk: switch the backend to Postgres and artifact root to R2.

## Mount MLflow under `/mlflow`

`backend/athena/api/mlflow_proxy.py`:

```python
"""Mount the MLflow tracking UI as a sub-application.

MLflow exposes a Flask app via `mlflow.server.app`. We mount it under
/mlflow on the same FastAPI host so we don't need a separate process or
domain. In dev, no auth. In prod, gate it behind admin-only middleware
(see TODO at bottom of file)."""

from fastapi import FastAPI
from starlette.middleware.wsgi import WSGIMiddleware

from athena.settings import get_settings


def mount(app: FastAPI) -> None:
    import mlflow
    from mlflow.server import app as mlflow_flask_app

    settings = get_settings()
    mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
    # The MLflow Flask app reads env vars for these; set them at import time.
    import os
    os.environ["MLFLOW_TRACKING_URI"] = settings.mlflow_tracking_uri
    os.environ["MLFLOW_DEFAULT_ARTIFACT_ROOT"] = settings.mlflow_artifact_root

    app.mount("/mlflow", WSGIMiddleware(mlflow_flask_app))

    # TODO: in prod, wrap with an admin-only middleware before mounting.
```

!!! warning "Don't expose `/mlflow` publicly without auth in prod"
    The MLflow UI has no built-in auth. Before going live, either (a) put it behind your existing session middleware (allow only `is_admin=True` users), or (b) leave it unmounted in prod and only access it locally via `mlflow ui --backend-store-uri <prod-db>`.

Wire it into `main.py`'s `create_app`:

```python
# main.py — inside create_app(), after add_middleware calls
if not settings.is_prod:  # remove this guard once you've added admin auth
    from athena.api.mlflow_proxy import mount as mount_mlflow
    mount_mlflow(app)
```

## The client wrapper

`backend/athena/integrations/mlflow_client.py`:

```python
"""Thin wrapper. Keep MLflow SDK calls in this one place so the rest of
the codebase imports `start_run`, `log_param`, ... from us and we can
swap MLflow out later if needed."""

from contextlib import contextmanager
from typing import Any

import mlflow
from mlflow.tracking import MlflowClient

from athena.settings import get_settings

_settings = get_settings()
mlflow.set_tracking_uri(_settings.mlflow_tracking_uri)


def client() -> MlflowClient:
    return MlflowClient(tracking_uri=_settings.mlflow_tracking_uri)


def ensure_experiment(name: str) -> str:
    """Returns experiment_id, creating if missing."""
    c = client()
    exp = c.get_experiment_by_name(name)
    if exp is None:
        return c.create_experiment(
            name=name,
            artifact_location=_settings.mlflow_artifact_root,
        )
    return exp.experiment_id


@contextmanager
def start_run(experiment: str, run_name: str, tags: dict[str, str] | None = None):
    exp_id = ensure_experiment(experiment)
    active = mlflow.start_run(experiment_id=exp_id, run_name=run_name, tags=tags or {})
    try:
        yield active.info.run_id
    finally:
        mlflow.end_run()


def log_params(params: dict[str, Any]) -> None:
    mlflow.log_params({k: str(v) for k, v in params.items()})


def log_metric(name: str, value: float, step: int | None = None) -> None:
    mlflow.log_metric(key=name, value=value, step=step)


def log_artifact(local_path: str, artifact_path: str | None = None) -> None:
    mlflow.log_artifact(local_path, artifact_path=artifact_path)


def log_sklearn_model(model, artifact_path: str = "model") -> None:
    import mlflow.sklearn
    mlflow.sklearn.log_model(sk_model=model, artifact_path=artifact_path)


def log_lightgbm_model(model, artifact_path: str = "model") -> None:
    import mlflow.lightgbm
    mlflow.lightgbm.log_model(lgb_model=model, artifact_path=artifact_path)
```

## Use it from `core/train.py`

Refactor `execute` to actually train and log to MLflow. Replace the contents:

```python
import asyncio
import tempfile
from pathlib import Path
from uuid import UUID

import numpy as np
import pandas as pd
from sqlalchemy import select

from athena.core.snippet import SnippetRecorder
from athena.db.models import Artifact, Metric, Run
from athena.db.session import session_scope
from athena.integrations import mlflow_client as mlf
from athena.integrations.storage import upload_file


async def execute(run_id: UUID) -> dict:
    async with session_scope() as session:
        run = (await session.execute(select(Run).where(Run.id == run_id))).scalar_one()
        base_model = run.base_model
        hp = run.hyperparameters
        user_id = run.user_id
        dataset_id = run.dataset_id

    snip = SnippetRecorder(run_id=run_id)

    try:
        with mlf.start_run(
            experiment=f"user-{user_id}",
            run_name=f"run-{run_id}",
            tags={"athena_run_id": str(run_id), "base_model": base_model},
        ) as mlflow_run_id:

            async with session_scope() as session:
                r = (await session.execute(select(Run).where(Run.id == run_id))).scalar_one()
                r.mlflow_run_id = mlflow_run_id

            mlf.log_params(hp)

            # 1. Load data (stub)
            snip.add(
                "1 · Load the dataset",
                """
                import pandas as pd
                df = pd.read_csv("data.csv")
                """,
            )

            # 2. Featurize (stub — see page 06 for the real version)
            X = np.random.rand(200, 2048)
            y = np.random.rand(200)

            snip.add(
                "2 · Featurize SMILES → Morgan fingerprints",
                """
                from rdkit import Chem
                from rdkit.Chem import AllChem
                import numpy as np

                def to_fp(smi):
                    mol = Chem.MolFromSmiles(smi)
                    fp = AllChem.GetMorganFingerprintAsBitVect(mol, 2, 2048)
                    return np.array(fp, dtype=np.uint8)

                X = np.stack([to_fp(s) for s in df["smiles"]])
                y = df["activity"].values
                """,
            )

            # 3. Train
            import lightgbm as lgb
            from sklearn.model_selection import train_test_split

            X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
            model = lgb.LGBMRegressor(
                n_estimators=hp.get("n_estimators", 200),
                learning_rate=hp.get("learning_rate", 0.05),
                num_leaves=hp.get("num_leaves", 31),
            )

            def _callback(env):
                # log metric every 10 iters
                if env.iteration % 10 == 0:
                    for name, _, val, _ in env.evaluation_result_list:
                        mlf.log_metric(name=f"val_{name}", value=val, step=env.iteration)

            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                callbacks=[lgb.early_stopping(20), _callback],
            )

            # mirror metrics into Athena DB so SSE can stream them
            for step, val in enumerate(model.evals_result_["valid_0"]["l2"][::10]):
                async with session_scope() as session:
                    session.add(Metric(run_id=run_id, step=step * 10, name="val_l2", value=val))

            snip.add_template(
                "3 · Train a LightGBM regressor",
                """
                import lightgbm as lgb
                from sklearn.model_selection import train_test_split

                X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
                model = lgb.LGBMRegressor(
                    n_estimators={n_estimators},
                    learning_rate={learning_rate},
                    num_leaves={num_leaves},
                )
                model.fit(X_train, y_train,
                          eval_set=[(X_val, y_val)],
                          callbacks=[lgb.early_stopping(20)])
                """,
                n_estimators=hp.get("n_estimators", 200),
                learning_rate=hp.get("learning_rate", 0.05),
                num_leaves=hp.get("num_leaves", 31),
            )

            # 4. Log model
            mlf.log_lightgbm_model(model, artifact_path="model")
            snip.add(
                "4 · Log the model with MLflow",
                """
                import mlflow.lightgbm
                with mlflow.start_run():
                    mlflow.lightgbm.log_model(lgb_model=model, artifact_path="model")
                """,
            )

            # 5. (Optional) push artifact to R2 too, for download links
            with tempfile.TemporaryDirectory() as tmp:
                p = Path(tmp) / "model.txt"
                model.booster_.save_model(str(p))
                uri = await upload_file(p, key=f"runs/{run_id}/model.txt")
                async with session_scope() as session:
                    session.add(Artifact(run_id=run_id, kind="model", uri=uri, size_bytes=p.stat().st_size))

            return {"mlflow_run_id": mlflow_run_id}
    finally:
        await snip.flush()
```

## Object storage helper

`backend/athena/integrations/storage.py`:

```python
"""Thin S3 wrapper. Works with AWS S3, Cloudflare R2, MinIO — anything S3-compatible.

In dev (no S3 env vars set), files are written to ./data/uploads/ and
returned as file:// URIs."""

import shutil
from pathlib import Path

import boto3

from athena.logging_config import get_logger
from athena.settings import get_settings

log = get_logger(__name__)


def _client():
    s = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=s.s3_endpoint_url,
        aws_access_key_id=s.s3_access_key,
        aws_secret_access_key=s.s3_secret_key,
        region_name="auto",
    )


async def upload_file(path: Path, key: str) -> str:
    s = get_settings()
    if not s.s3_endpoint_url or not s.s3_access_key:
        # dev fallback
        dest = Path("./data/uploads") / key
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(path, dest)
        log.info("storage.local", key=key, path=str(dest))
        return f"file://{dest.resolve()}"

    _client().upload_file(str(path), s.s3_bucket, key)
    log.info("storage.s3", bucket=s.s3_bucket, key=key)
    return f"s3://{s.s3_bucket}/{key}"
```

## Test it

Re-run the [page 05 smoke test](05-jobs.md#smoke-test). Then open <http://localhost:8000/mlflow> — you should see your experiment with a single run, containing logged params and one or more `val_l2` metrics. Click into the run, then the `model` artifact — MLflow renders a model card.

## Definition of done

- [ ] `/mlflow` opens and shows the run with logged params + metrics.
- [ ] `runs.mlflow_run_id` in Postgres matches the MLflow run id in the UI.
- [ ] An `Artifact` row exists with a `file://` (dev) or `s3://` (R2) URI.
- [ ] A `Snippet` row of title "4 · Log the model with MLflow" exists.

Next: **[08 · HuggingFace (Manual) →](08-huggingface.md)**
