# 02 · Backend Skeleton

Goal: a running FastAPI app that responds to `GET /api/health`, has structured logging, has CORS for the frontend, and is wired for everything we'll add later. No business logic yet.

## `settings.py`

`backend/athena/settings.py`:

```python
from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"

    secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_ttl_seconds: int = 60 * 60 * 24 * 30  # 30 days

    database_url: str
    redis_url: str = "redis://localhost:6379/0"

    mlflow_tracking_uri: str = "sqlite:///./data/mlflow.db"
    mlflow_artifact_root: str = "./data/mlartifacts"

    s3_endpoint_url: str | None = None
    s3_bucket: str = "athena-artifacts"
    s3_access_key: str | None = None
    s3_secret_key: str | None = None

    hf_token: str | None = None

    resend_api_key: str | None = None
    mail_from: str = "athena@example.com"

    allowed_origins: str = "http://localhost:5173"

    sentry_dsn: str | None = None

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_prod(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
```

!!! tip "Why `@lru_cache`"
    Reading `.env` is cheap but constructing a `Settings()` every request is wasteful. `@lru_cache` makes it a singleton. Tests can override it via FastAPI's dependency overrides.

## Logging setup

`backend/athena/logging_config.py`:

```python
import logging
import sys

import structlog

from athena.settings import get_settings


def configure_logging() -> None:
    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    timestamper = structlog.processors.TimeStamper(fmt="iso")

    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        timestamper,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.is_prod:
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )

    # Quiet the noisy ones
    for noisy in ("uvicorn.access", "sqlalchemy.engine.Engine"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
```

## Request-logging middleware

`backend/athena/middleware.py`:

```python
import time
import uuid
from collections.abc import Awaitable, Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

log = structlog.get_logger(__name__)


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        structlog.contextvars.bind_contextvars(request_id=request_id)

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            log.exception("request.failed", method=request.method, path=request.url.path)
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["x-request-id"] = request_id

        if not request.url.path.startswith("/api/health"):
            log.info(
                "request",
                method=request.method,
                path=request.url.path,
                status=response.status_code,
                elapsed_ms=round(elapsed_ms, 1),
            )

        structlog.contextvars.clear_contextvars()
        return response
```

## The app entrypoint

`backend/athena/main.py`:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from athena.api import auth, datasets, huggingface, models, runs
from athena.logging_config import configure_logging, get_logger
from athena.middleware import RequestLogMiddleware
from athena.settings import get_settings

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    settings = get_settings()
    log.info("startup", env=settings.environment)
    # DB engine init, MLflow init, etc. will go here later
    yield
    log.info("shutdown")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Athena API",
        version="0.1.0",
        docs_url="/api/docs" if not settings.is_prod else None,
        redoc_url=None,
        openapi_url="/api/openapi.json" if not settings.is_prod else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["x-request-id"],
    )
    app.add_middleware(RequestLogMiddleware)

    @app.get("/api/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    # Routers
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
    app.include_router(models.router, prefix="/api/models", tags=["models"])
    app.include_router(runs.router, prefix="/api/runs", tags=["runs"])
    app.include_router(huggingface.router, prefix="/api/hf", tags=["huggingface"])

    return app


app = create_app()
```

## Stub the routers

Each router file is a placeholder for now — we'll fill them in over the next pages.

`backend/athena/api/auth.py`:

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/me")
async def me() -> dict[str, str]:
    return {"id": "stub", "email": "stub@example.com"}
```

Repeat the same one-line pattern for `datasets.py`, `models.py`, `runs.py`, `huggingface.py` — each with `router = APIRouter()` and a single `GET /` endpoint returning `{"ok": True}`. They exist so `main.py` can import them.

```python
# datasets.py / models.py / runs.py / huggingface.py
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def index() -> dict[str, bool]:
    return {"ok": True}
```

## Run it

```bash
cd backend
uv run uvicorn athena.main:app --reload --host 0.0.0.0 --port 8000
```

Open <http://localhost:8000/api/health>. Should see `{"status":"ok"}`.

Open <http://localhost:8000/api/docs>. Should see Swagger UI listing your five stub routers.

Check the terminal — you should see structured logs for every request **except** `/api/health` (we excluded it to keep the noise down).

## Definition of done

- [ ] `GET /api/health` returns `{"status":"ok"}`.
- [ ] `GET /api/auth/me` returns the stub.
- [ ] `/api/docs` lists all five routers.
- [ ] Hitting any endpoint logs a structured line with `request_id`, `elapsed_ms`.

Next: **[03 · Database & Migrations →](03-database.md)**
