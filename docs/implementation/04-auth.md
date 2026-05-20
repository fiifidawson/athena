# 04 · Authentication

**Magic links over passwords.** Reasons:

- No password storage, no password reset flow, no rate-limit hell.
- For an MVP, email-to-inbox is good enough.
- Easy to upgrade later (add OAuth providers without ripping anything out).

Flow: user enters email → we email them a one-time link → clicking the link sets a long-lived JWT in an `HttpOnly` cookie → done.

## Token utilities

`backend/athena/core/tokens.py`:

```python
import jwt
from datetime import datetime, timedelta, timezone

from athena.settings import get_settings

settings = get_settings()


def make_jwt(sub: str, ttl_seconds: int, kind: str = "session") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "kind": kind,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=ttl_seconds)).timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str, expected_kind: str = "session") -> dict:
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("kind") != expected_kind:
        raise jwt.InvalidTokenError(f"expected kind={expected_kind}, got {payload.get('kind')}")
    return payload
```

## HF token encryption

We need to store user HF tokens. Plaintext in the DB would be reckless. Use Fernet (symmetric AES) keyed off `SECRET_KEY`.

`backend/athena/core/crypto.py`:

```python
import base64
import hashlib

from cryptography.fernet import Fernet

from athena.settings import get_settings


def _fernet() -> Fernet:
    key_bytes = hashlib.sha256(get_settings().secret_key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key_bytes))


def encrypt_str(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_str(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode()).decode()
```

Add `cryptography` to `pyproject.toml` dependencies (`cryptography==44.0.0`) and `uv sync`.

## Email sender

`backend/athena/integrations/mail.py`:

```python
import httpx

from athena.logging_config import get_logger
from athena.settings import get_settings

log = get_logger(__name__)


async def send_magic_link(to: str, link: str) -> None:
    settings = get_settings()
    if not settings.resend_api_key:
        # Dev fallback: just log the link.
        log.warning("mail.dev_fallback", to=to, link=link)
        return

    html = f"""
    <p>Click below to sign in to Athena. This link expires in 15 minutes.</p>
    <p><a href="{link}">Sign in</a></p>
    <p>Or paste this into your browser: {link}</p>
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": settings.mail_from,
                "to": [to],
                "subject": "Sign in to Athena",
                "html": html,
            },
        )
        r.raise_for_status()
        log.info("mail.sent", to=to)
```

## Auth routes

Replace `backend/athena/api/auth.py`:

```python
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from athena.core.tokens import decode_jwt, make_jwt
from athena.db.models import User
from athena.deps import SessionDep
from athena.integrations.mail import send_magic_link
from athena.settings import get_settings

router = APIRouter()
SESSION_COOKIE = "athena_session"


class RequestLinkPayload(BaseModel):
    email: EmailStr


@router.post("/request-link", status_code=204)
async def request_link(payload: RequestLinkPayload, request: Request) -> Response:
    settings = get_settings()
    # 15-minute magic token; sub = email so we can mint a User on click.
    magic = make_jwt(sub=payload.email, ttl_seconds=15 * 60, kind="magic")

    origin = request.headers.get("origin") or settings.allowed_origins_list[0]
    link = f"{origin}/auth/callback?token={magic}"
    await send_magic_link(payload.email, link)
    return Response(status_code=204)


@router.get("/callback")
async def callback(token: str, response: Response, session: SessionDep):
    import jwt as _jwt
    try:
        payload = decode_jwt(token, expected_kind="magic")
    except _jwt.PyJWTError as e:
        raise HTTPException(status_code=400, detail=f"Invalid or expired link: {e}")

    email = payload["sub"]
    user = (await session.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None:
        user = User(email=email)
        session.add(user)
        await session.commit()
        await session.refresh(user)

    settings = get_settings()
    session_token = make_jwt(sub=str(user.id), ttl_seconds=settings.jwt_ttl_seconds, kind="session")
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_token,
        max_age=settings.jwt_ttl_seconds,
        httponly=True,
        secure=settings.is_prod,
        samesite="lax",
        path="/",
    )
    return {"id": str(user.id), "email": user.email}


@router.post("/logout", status_code=204)
async def logout(response: Response) -> Response:
    response.delete_cookie(SESSION_COOKIE, path="/")
    return Response(status_code=204)


async def _current_user(
    session: SessionDep,
    athena_session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> User:
    import jwt as _jwt
    if athena_session is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_jwt(athena_session, expected_kind="session")
    except _jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid session")
    user = (
        await session.execute(select(User).where(User.id == payload["sub"]))
    ).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


CurrentUser = Annotated[User, Depends(_current_user)]


@router.get("/me")
async def me(user: CurrentUser):
    return {"id": str(user.id), "email": user.email, "has_hf_token": bool(user.hf_token_encrypted)}
```

Expose `CurrentUser` from `deps.py` too so other routes can import it without circular imports:

```python
# athena/deps.py (append)
from athena.api.auth import CurrentUser  # noqa: F401  -- re-export
```

## Test it

```bash
# in one terminal
uv run uvicorn athena.main:app --reload

# in another
curl -X POST localhost:8000/api/auth/request-link \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com"}'
```

In the API terminal you'll see a log line like:

```
mail.dev_fallback to=you@example.com link=http://localhost:5173/auth/callback?token=eyJ...
```

(That's the dev fallback because `RESEND_API_KEY` is empty.) Copy the token from the URL and hit the callback:

```bash
curl -i "localhost:8000/api/auth/callback?token=eyJ..."
# look for: Set-Cookie: athena_session=...; HttpOnly; SameSite=lax; Path=/
```

Use the cookie:

```bash
curl localhost:8000/api/auth/me \
  -b "athena_session=eyJ..."
# {"id":"...","email":"you@example.com","has_hf_token":false}
```

## Definition of done

- [ ] `POST /api/auth/request-link` returns 204 and logs the link in dev.
- [ ] Visiting the magic-link URL sets an `HttpOnly` session cookie.
- [ ] `GET /api/auth/me` with the cookie returns the user; without it returns 401.
- [ ] A second `request-link` for the same email reuses the existing user.

Next: **[05 · Background Jobs →](05-jobs.md)**
