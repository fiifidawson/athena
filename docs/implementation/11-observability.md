# 11 · Observability

You shipped. Now you need to know when it breaks.

## Sentry (errors)

Three places: API, worker, frontend.

### Backend

Inside `athena/main.py`, before `create_app`:

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration


def _init_sentry() -> None:
    settings = get_settings()
    if not settings.sentry_dsn:
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.1,
        profiles_sample_rate=0.0,
        send_default_pii=False,
        integrations=[FastApiIntegration(), StarletteIntegration()],
    )


_init_sentry()
```

Repeat the same call at the top of `athena/worker.py` — Sentry's `arq` integration doesn't exist; the SDK still picks up unhandled exceptions in async jobs.

### Frontend

```bash
cd frontend
npm install @sentry/react
```

`frontend/src/main.tsx`:

```tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}
```

Set `VITE_SENTRY_DSN` in Vercel.

## Structured logs you'll actually search

Already done in [page 02](02-backend-skeleton.md) — every request gets a `request_id` you can grep for in Render's log viewer.

Add `user_id` and `run_id` to context when available so you can filter by user when triaging:

```python
# inside any handler/job after you know the user
import structlog
structlog.contextvars.bind_contextvars(user_id=str(user.id))
```

These show up automatically on every subsequent log line in that request/job.

## Health endpoints

`/api/health` already exists. Add deeper checks for cron monitoring:

```python
# athena/api/__init__.py or wherever health lives
@router.get("/health/full")
async def health_full(session: SessionDep) -> dict:
    checks: dict[str, str] = {}
    try:
        await session.execute("SELECT 1")
        checks["db"] = "ok"
    except Exception as e:
        checks["db"] = f"error: {e}"

    try:
        from athena.integrations.queue import get_queue
        q = await get_queue()
        await q.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {e}"

    return checks
```

Point a free uptime monitor (Better Uptime, UptimeRobot) at `/api/health/full` every 5 min. Alert on anything not `ok`.

## Metrics (optional, but free)

If you want graphs without setting up Prometheus, add **Posthog** for product analytics:

```bash
npm install posthog-js
```

```tsx
// frontend/src/main.tsx
import posthog from "posthog-js";
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, { api_host: "https://us.i.posthog.com" });
}
```

Track key events:

```tsx
posthog.capture("run_started", { base_model: model });
posthog.capture("snippet_copied", { snippet_title: s.title });
```

Now you can see which models people pick and which snippets they actually copy — gold for product decisions.

## Definition of done

- [ ] Throwing an unhandled error in any route shows up in Sentry within a minute.
- [ ] `/api/health/full` returns ok for db + redis in prod.
- [ ] Posthog (or your analytics) records `run_started` on the prod frontend.

Next: **[12 · Testing →](12-testing.md)**
