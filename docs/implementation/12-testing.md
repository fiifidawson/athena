# 12 · Testing

You don't need 100% coverage. You need **the four tests that catch the four bugs most likely to ship**.

## The four tests

| # | What it covers | Why |
|---|---|---|
| 1 | A migration roundtrip on a fresh DB | Catches Alembic drift before it bricks deploy. |
| 2 | `POST /api/runs` → arq → status `done` | The full happy path. If this breaks, the product is broken. |
| 3 | Snippets contain the actual hyperparameters used | Catches "snippet lies" — the single bug that destroys trust in the whole product. |
| 4 | HF gated repo returns a 4xx, not a 500 | Common failure mode for new users; turning a 500 into a 4xx with a helpful message is huge. |

Everything else is a bonus.

## Fixtures

`backend/tests/conftest.py`:

```python
import asyncio
import os
from collections.abc import AsyncIterator

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

# Use sqlite for tests — fast, no docker dependency
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")

from athena.db.base import Base
from athena.db.session import engine, SessionLocal


@pytest_asyncio.fixture(autouse=True)
async def _schema() -> AsyncIterator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as s:
        yield s
```

## Test 1 — migrations

`backend/tests/test_migrations.py`:

```python
import subprocess


def test_alembic_upgrade_then_downgrade_then_upgrade(tmp_path, monkeypatch):
    """If migrations aren't reversible, future schema rewrites will be painful."""
    db_url = f"sqlite:///{tmp_path}/test.db"
    monkeypatch.setenv("DATABASE_URL", db_url.replace("sqlite:", "sqlite+aiosqlite:"))
    env = {**os.environ, "DATABASE_URL": db_url}
    # alembic uses sync driver — strip the +aiosqlite
    for cmd in ["upgrade head", "downgrade base", "upgrade head"]:
        r = subprocess.run(["alembic", *cmd.split()], env=env, capture_output=True)
        assert r.returncode == 0, r.stderr.decode()
```

## Test 2 — happy-path run

`backend/tests/test_run_happy_path.py`:

```python
import asyncio
from uuid import uuid4

import pytest

from athena.db.models import Dataset, Run, User
from athena.jobs.training import train_run


@pytest.mark.asyncio
async def test_train_run_marks_done(session, monkeypatch):
    # disable mlflow + s3 for this test
    async def _fake_execute(run_id):
        return {"steps": 0}
    monkeypatch.setattr("athena.core.train.execute", _fake_execute)

    user = User(email="t@example.com")
    session.add(user)
    await session.commit()
    await session.refresh(user)

    ds = Dataset(user_id=user.id, name="fake", source="upload", storage_uri="file:///tmp")
    session.add(ds)
    await session.commit()
    await session.refresh(ds)

    run = Run(user_id=user.id, dataset_id=ds.id, base_model="lightgbm")
    session.add(run)
    await session.commit()
    await session.refresh(run)

    await train_run({}, str(run.id))

    await session.refresh(run)
    assert run.status == "done"
    assert run.error is None
    assert run.finished_at is not None
```

## Test 3 — snippet truthfulness

`backend/tests/test_snippet_truth.py`:

```python
import pytest

from athena.core.snippet import SnippetRecorder
from athena.db.models import Snippet, Run, User, Dataset
from sqlalchemy import select


@pytest.mark.asyncio
async def test_snippet_substitutions_match_hyperparameters(session):
    user = User(email="x@example.com"); session.add(user); await session.commit(); await session.refresh(user)
    ds = Dataset(user_id=user.id, name="x", source="upload", storage_uri="file:///"); session.add(ds); await session.commit(); await session.refresh(ds)
    run = Run(user_id=user.id, dataset_id=ds.id, base_model="lightgbm",
              hyperparameters={"n_estimators": 777, "learning_rate": 0.123}); session.add(run); await session.commit(); await session.refresh(run)

    snip = SnippetRecorder(run_id=run.id)
    snip.add_template(
        "train",
        "model = lgb.LGBMRegressor(n_estimators={n_estimators}, learning_rate={learning_rate})",
        n_estimators=run.hyperparameters["n_estimators"],
        learning_rate=run.hyperparameters["learning_rate"],
    )
    await snip.flush()

    rows = (await session.execute(select(Snippet).where(Snippet.run_id == run.id))).scalars().all()
    assert len(rows) == 1
    code = rows[0].code
    assert "777" in code
    assert "0.123" in code
    # the actual repr of these values must appear verbatim
```

## Test 4 — HF gated repo handling

`backend/tests/test_hf_gated.py`:

```python
import pytest
from unittest.mock import patch
from huggingface_hub.errors import GatedRepoError

from athena.integrations.huggingface import download_model, GatedAccess


def test_gated_model_raises_typed_error():
    with patch("athena.integrations.huggingface.snapshot_download",
               side_effect=GatedRepoError("gated")):
        with pytest.raises(GatedAccess) as ei:
            download_model("meta-llama/Llama-2-7b")
        assert "Llama-2-7b" in str(ei.value)
```

## Run them

```bash
cd backend
uv run pytest -q
```

CI runs them on every PR (we wired this in [page 10](10-deploy.md#ci)).

## Frontend tests

Skip for now. The frontend code is mostly glue; a typecheck (`tsc --noEmit`) catches the most likely bugs. Add Vitest later if you want, but it's not on the critical path.

## Definition of done

- [ ] `uv run pytest -q` runs all four tests green in under 10 seconds.
- [ ] CI badge in the README turns green after the first push.
- [ ] You've intentionally broken one test (e.g., change `777` to `776` in test 3) to confirm it actually fails.

🎉 You've shipped. The next page is the **Future** tab — read it when you're ready to start thinking about the local-first version.
