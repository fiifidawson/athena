# 05 · Background Jobs

Training runs take minutes to hours. They cannot block an HTTP request. We use **arq** (async-native, Redis-backed, ~50 lines of config) instead of Celery (sync, big, finicky).

## Mental model

```
┌────────────┐   POST /api/runs    ┌────────────┐   enqueue   ┌─────────┐
│  Frontend  │ ──────────────────► │  FastAPI   │ ──────────► │  Redis  │
└────────────┘                     └────────────┘             └────┬────┘
       ▲                                  ▲                        │
       │ SSE /api/runs/{id}/events        │ read DB                │ dequeue
       │                                  │                        ▼
       │                          ┌────────────┐    update    ┌────────────┐
       └───── stream updates ─────│ Postgres   │ ◄──────────  │ arq worker │
                                  └────────────┘              └────────────┘
```

The API **enqueues** and **reads progress from the DB**. The worker **does the work** and **writes progress to the DB**. They never talk to each other directly.

## Worker entrypoint

`backend/athena/worker.py`:

```python
from arq.connections import RedisSettings

from athena.jobs.training import train_run
from athena.logging_config import configure_logging, get_logger
from athena.settings import get_settings

settings = get_settings()
log = get_logger(__name__)


async def startup(ctx):
    configure_logging()
    log.info("worker.startup")


async def shutdown(ctx):
    log.info("worker.shutdown")


class WorkerSettings:
    functions = [train_run]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    on_startup = startup
    on_shutdown = shutdown
    max_jobs = 2          # how many runs to execute in parallel
    job_timeout = 60 * 60 # 1h hard cap per run
    keep_result = 3600
```

## Job function

`backend/athena/jobs/training.py`:

```python
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select

from athena.db.models import Run
from athena.db.session import session_scope
from athena.logging_config import get_logger

log = get_logger(__name__)


async def train_run(ctx, run_id: str) -> dict:
    """Entry point for arq. Loads the Run, dispatches to core, marks done/failed."""
    rid = UUID(run_id)
    log.info("job.train_run.start", run_id=str(rid))

    async with session_scope() as session:
        run = (await session.execute(select(Run).where(Run.id == rid))).scalar_one()
        run.status = "running"
        run.started_at = datetime.now(timezone.utc)

    try:
        from athena.core.train import execute  # local import to keep worker startup fast
        result = await execute(run_id=rid)
    except Exception as e:
        log.exception("job.train_run.failed", run_id=str(rid))
        async with session_scope() as session:
            run = (await session.execute(select(Run).where(Run.id == rid))).scalar_one()
            run.status = "failed"
            run.error = str(e)
            run.finished_at = datetime.now(timezone.utc)
        raise

    async with session_scope() as session:
        run = (await session.execute(select(Run).where(Run.id == rid))).scalar_one()
        run.status = "done"
        run.finished_at = datetime.now(timezone.utc)

    log.info("job.train_run.done", run_id=str(rid), result=result)
    return result
```

## Stub the `core.train.execute`

`backend/athena/core/train.py`:

```python
import asyncio
from uuid import UUID

from sqlalchemy import select

from athena.db.models import Metric, Run
from athena.db.session import session_scope


async def execute(run_id: UUID) -> dict:
    """Placeholder: pretend to train for 10 steps. Real impl arrives in pages 07–08."""
    for step in range(10):
        await asyncio.sleep(0.5)
        async with session_scope() as session:
            session.add(Metric(run_id=run_id, step=step, name="train_loss", value=1.0 / (step + 1)))
    return {"steps": 10, "final_loss": 0.1}
```

## Redis pool on the API side

`backend/athena/integrations/queue.py`:

```python
from arq import create_pool
from arq.connections import ArqRedis, RedisSettings

from athena.settings import get_settings

_pool: ArqRedis | None = None


async def get_queue() -> ArqRedis:
    global _pool
    if _pool is None:
        _pool = await create_pool(RedisSettings.from_dsn(get_settings().redis_url))
    return _pool


async def close_queue() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
```

Wire it into the lifespan in `main.py`:

```python
# main.py — replace the lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    log.info("startup", env=get_settings().environment)
    yield
    from athena.integrations.queue import close_queue
    await close_queue()
    log.info("shutdown")
```

## Runs API

Replace `backend/athena/api/runs.py`:

```python
import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select

from athena.db.models import Metric, Run
from athena.deps import CurrentUser, SessionDep
from athena.integrations.queue import get_queue

router = APIRouter()


class CreateRunPayload(BaseModel):
    dataset_id: UUID
    base_model: str
    hyperparameters: dict = {}


@router.post("", status_code=201)
async def create_run(payload: CreateRunPayload, user: CurrentUser, session: SessionDep):
    run = Run(
        user_id=user.id,
        dataset_id=payload.dataset_id,
        base_model=payload.base_model,
        hyperparameters=payload.hyperparameters,
    )
    session.add(run)
    await session.commit()
    await session.refresh(run)

    queue = await get_queue()
    await queue.enqueue_job("train_run", str(run.id))
    return {"id": str(run.id), "status": run.status}


@router.get("/{run_id}")
async def get_run(run_id: UUID, user: CurrentUser, session: SessionDep):
    run = (await session.execute(select(Run).where(Run.id == run_id, Run.user_id == user.id))).scalar_one_or_none()
    if run is None:
        raise HTTPException(404)
    return {
        "id": str(run.id),
        "status": run.status,
        "base_model": run.base_model,
        "started_at": run.started_at,
        "finished_at": run.finished_at,
        "error": run.error,
    }


@router.get("/{run_id}/events")
async def stream_events(run_id: UUID, user: CurrentUser, session: SessionDep):
    """Server-Sent Events: polls the DB and pushes new metrics + status changes."""

    async def event_stream():
        last_step = -1
        last_status = ""
        while True:
            async with session.begin():
                run = (await session.execute(select(Run).where(Run.id == run_id, Run.user_id == user.id))).scalar_one_or_none()
                if run is None:
                    yield f"event: error\ndata: not found\n\n"
                    return

                if run.status != last_status:
                    yield f"event: status\ndata: {run.status}\n\n"
                    last_status = run.status

                new_metrics = (
                    await session.execute(
                        select(Metric).where(Metric.run_id == run_id, Metric.step > last_step).order_by(Metric.step)
                    )
                ).scalars().all()
                for m in new_metrics:
                    payload = {"step": m.step, "name": m.name, "value": m.value}
                    yield f"event: metric\ndata: {json.dumps(payload)}\n\n"
                    last_step = max(last_step, m.step)

            if run.status in ("done", "failed"):
                return
            await asyncio.sleep(1.0)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

!!! warning "SSE polling vs pub/sub"
    Polling the DB once per second per active stream is fine up to a few dozen concurrent runs. When you have hundreds, switch to Redis pub/sub: the worker publishes on `run:<id>` and the SSE handler subscribes. Don't optimize this until you need to.

## Run the worker

You now run **two** processes during dev. Two terminals:

=== "Terminal 1 — API"
    ```bash
    cd backend
    uv run uvicorn athena.main:app --reload
    ```

=== "Terminal 2 — worker"
    ```bash
    cd backend
    uv run arq athena.worker.WorkerSettings
    ```

## Smoke test

```bash
# create a dataset row directly so we have a valid dataset_id
docker compose -f infra/docker-compose.yml exec postgres psql -U athena -d athena -c \
  "INSERT INTO datasets (id, user_id, name, source, storage_uri) VALUES (gen_random_uuid(), '<your-user-id>', 'fake', 'upload', 'file://tmp');"
# (replace <your-user-id> with the UUID you got from /api/auth/me)

# enqueue a run
curl -X POST localhost:8000/api/runs \
  -b "athena_session=..." \
  -H 'content-type: application/json' \
  -d '{"dataset_id":"<the-dataset-id>","base_model":"lightgbm"}'
# {"id":"<run-id>","status":"queued"}

# stream
curl -N localhost:8000/api/runs/<run-id>/events -b "athena_session=..."
```

You should see `event: status` lines and 10 `event: metric` lines with a decreasing `train_loss`.

## Definition of done

- [ ] `POST /api/runs` returns a run id and the worker picks it up within ~1s.
- [ ] `GET /api/runs/<id>/events` streams 10 metrics and ends after status `done`.
- [ ] If you kill the worker mid-run, the run stays `running` (we'll fix this with a heartbeat later).

Next: **[06 · Code-Snippet Recorder →](06-code-snippets.md)**
