# 08 · HuggingFace (Manual)

What "manual" means: we call `huggingface_hub` directly instead of using a wrapper like `setfit` or `transformers.Trainer`. The user supplies a token, we use it to list / download / upload models and datasets. No black boxes.

## Capabilities to build

| Feature | Endpoint | Notes |
|---|---|---|
| Save a user's HF token (encrypted) | `PUT /api/hf/token` | Reuses `core/crypto.py` from page 04 |
| Search models | `GET /api/hf/models/search?q=...` | Filters to drug-discovery-relevant tags |
| Search datasets | `GET /api/hf/datasets/search?q=...` | |
| Inspect a dataset (subsets, splits) | `GET /api/hf/datasets/{repo}` | Needed for the dropdown chain in dashboard_2.jpg |
| Download a dataset for training | (internal — called by jobs) | Cached on disk; pulled lazily |
| Push a trained model back to the Hub | `POST /api/runs/{id}/publish` | Optional, requires write-scoped token |

## Integration façade

`backend/athena/integrations/huggingface.py`:

```python
"""All HuggingFace interactions live here. The rest of the codebase imports
from this module — never `from huggingface_hub import HfApi` elsewhere.

Token handling: we accept three sources, in priority order:
  1. Per-request override (admin/debug)
  2. The current user's saved (encrypted) token
  3. A platform-wide HF_TOKEN env var (used for free-tier reads only)
"""

from dataclasses import dataclass
from pathlib import Path

from huggingface_hub import HfApi, snapshot_download

from athena.logging_config import get_logger
from athena.settings import get_settings

log = get_logger(__name__)


@dataclass(frozen=True)
class ModelSummary:
    id: str
    pipeline_tag: str | None
    downloads: int
    likes: int
    private: bool


@dataclass(frozen=True)
class DatasetSummary:
    id: str
    tags: list[str]
    downloads: int
    private: bool


def _api(token: str | None) -> HfApi:
    return HfApi(token=token or get_settings().hf_token)


def search_models(query: str, token: str | None = None, limit: int = 25) -> list[ModelSummary]:
    api = _api(token)
    results = list(
        api.list_models(
            search=query,
            limit=limit,
            sort="downloads",
            direction=-1,
            full=False,
        )
    )
    return [
        ModelSummary(
            id=m.id,
            pipeline_tag=getattr(m, "pipeline_tag", None),
            downloads=getattr(m, "downloads", 0) or 0,
            likes=getattr(m, "likes", 0) or 0,
            private=bool(getattr(m, "private", False)),
        )
        for m in results
    ]


def search_datasets(query: str, token: str | None = None, limit: int = 25) -> list[DatasetSummary]:
    api = _api(token)
    results = list(
        api.list_datasets(
            search=query,
            limit=limit,
            sort="downloads",
            direction=-1,
            full=False,
        )
    )
    return [
        DatasetSummary(
            id=d.id,
            tags=list(getattr(d, "tags", []) or []),
            downloads=getattr(d, "downloads", 0) or 0,
            private=bool(getattr(d, "private", False)),
        )
        for d in results
    ]


def get_dataset_info(repo_id: str, token: str | None = None) -> dict:
    """Returns the subsets (configs) and splits available, for the cascading dropdowns."""
    from datasets import get_dataset_config_names, get_dataset_split_names

    configs = get_dataset_config_names(repo_id, token=token or get_settings().hf_token)
    out: dict[str, dict] = {"configs": {}}
    for cfg in configs:
        try:
            splits = get_dataset_split_names(repo_id, cfg, token=token or get_settings().hf_token)
        except Exception as e:
            log.warning("hf.dataset_info.splits_failed", repo=repo_id, config=cfg, error=str(e))
            splits = []
        out["configs"][cfg] = {"splits": splits}
    return out


def download_dataset(repo_id: str, token: str | None = None, cache_dir: str | None = None) -> str:
    """Snapshot-download the dataset repo. Returns local path."""
    path = snapshot_download(
        repo_id=repo_id,
        repo_type="dataset",
        token=token or get_settings().hf_token,
        cache_dir=cache_dir,
    )
    log.info("hf.dataset.downloaded", repo=repo_id, path=path)
    return path


def upload_model_artifact(
    repo_id: str,
    local_path: Path,
    token: str,
    commit_message: str = "Upload model trained with Athena",
) -> str:
    """Upload a local file or folder to a model repo. Returns repo URL."""
    api = _api(token)
    api.create_repo(repo_id=repo_id, repo_type="model", exist_ok=True, private=True, token=token)
    if local_path.is_dir():
        api.upload_folder(
            folder_path=str(local_path),
            repo_id=repo_id,
            repo_type="model",
            token=token,
            commit_message=commit_message,
        )
    else:
        api.upload_file(
            path_or_fileobj=str(local_path),
            path_in_repo=local_path.name,
            repo_id=repo_id,
            repo_type="model",
            token=token,
            commit_message=commit_message,
        )
    return f"https://huggingface.co/{repo_id}"
```

## HF routes

Replace `backend/athena/api/huggingface.py`:

```python
from typing import Annotated

from fastapi import APIRouter, Body, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select

from athena.core.crypto import decrypt_str, encrypt_str
from athena.db.models import User
from athena.deps import CurrentUser, SessionDep
from athena.integrations import huggingface as hf

router = APIRouter()


class TokenPayload(BaseModel):
    token: str


def _resolve_token(user: User) -> str | None:
    if user.hf_token_encrypted:
        return decrypt_str(user.hf_token_encrypted)
    return None


@router.put("/token", status_code=204)
async def save_token(payload: TokenPayload, user: CurrentUser, session: SessionDep):
    if not payload.token.startswith("hf_"):
        raise HTTPException(400, "Token doesn't look like a HuggingFace token")
    user.hf_token_encrypted = encrypt_str(payload.token)
    await session.commit()


@router.delete("/token", status_code=204)
async def delete_token(user: CurrentUser, session: SessionDep):
    user.hf_token_encrypted = None
    await session.commit()


@router.get("/models/search")
async def search_models(
    user: CurrentUser,
    q: Annotated[str, Query(min_length=2)],
    limit: int = 25,
):
    token = _resolve_token(user)
    results = hf.search_models(q, token=token, limit=limit)
    return [r.__dict__ for r in results]


@router.get("/datasets/search")
async def search_datasets(
    user: CurrentUser,
    q: Annotated[str, Query(min_length=2)],
    limit: int = 25,
):
    token = _resolve_token(user)
    results = hf.search_datasets(q, token=token, limit=limit)
    return [r.__dict__ for r in results]


@router.get("/datasets/{owner}/{name}")
async def dataset_info(owner: str, name: str, user: CurrentUser):
    token = _resolve_token(user)
    try:
        return hf.get_dataset_info(f"{owner}/{name}", token=token)
    except Exception as e:
        raise HTTPException(400, f"Could not inspect dataset: {e}")
```

## Gated models (the tricky bit)

Some HF models (Llama, Gemma) require you to accept terms on the HF website before your token can download them. If the user's token doesn't have permission, `snapshot_download` raises `GatedRepoError`. Handle it gracefully:

```python
# inside huggingface.py — wrap download_dataset and a sibling download_model
from huggingface_hub.errors import GatedRepoError, RepositoryNotFoundError


def download_model(repo_id: str, token: str | None = None) -> str:
    try:
        return snapshot_download(
            repo_id=repo_id,
            repo_type="model",
            token=token or get_settings().hf_token,
        )
    except GatedRepoError as e:
        raise GatedAccess(
            f"You need to accept the terms for {repo_id} at https://huggingface.co/{repo_id}"
        ) from e
    except RepositoryNotFoundError as e:
        raise NotFound(f"Model {repo_id} not found or token lacks read access") from e


class GatedAccess(RuntimeError):
    pass


class NotFound(RuntimeError):
    pass
```

In `runs.py`, catch these and turn them into clean 4xx responses. The frontend then shows a "Click here to accept the terms" link.

## Snippet integration

Authoring rule (page 06): **every HF call should emit a snippet of the equivalent code.** Example, inside the job:

```python
# inside core/train.py, before downloading the dataset
snip.add_template(
    "1 · Pull the dataset from HuggingFace",
    """
    from huggingface_hub import snapshot_download
    path = snapshot_download(
        repo_id={repo_id},
        repo_type="dataset",
        token=YOUR_HF_TOKEN,
    )
    print(path)
    """,
    repo_id=hf_repo,
)
```

The user can copy this snippet, paste it into a notebook, and get the exact same local path — that's the learning outcome.

## Definition of done

- [ ] `PUT /api/hf/token` accepts a token, stores it encrypted.
- [ ] `GET /api/hf/models/search?q=gemma` returns at least one result.
- [ ] `GET /api/hf/datasets/unsloth/Radiology_mini` returns `{"configs": {"default": {"splits": ["train"]}}}` (matches dashboard_2.jpg).
- [ ] Requesting a gated model returns a 4xx with a useful message, not a 500.
- [ ] The HF token in the DB is unreadable as plaintext (`SELECT hf_token_encrypted FROM users` shows ciphertext).

Next: **[09 · Frontend Integration →](09-frontend.md)**
