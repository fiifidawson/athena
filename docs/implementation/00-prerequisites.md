# 00 · Prerequisites

Install these once. We'll reference them constantly.

## On your machine

| Tool | Version | Why |
|---|---|---|
| Python | 3.11.x | Match the deploy target. 3.12 works but some ML libs (RDKit wheels) lag. |
| Node | 20.x or 22.x | Vite 8 requires it. |
| `uv` | latest | Fast Python package + venv manager. We'll use it instead of `pip`/`virtualenv`. |
| Docker Desktop | latest | For running local Postgres + Redis. |
| `mkdocs` | 1.6.x | Build these docs locally. |
| `git` | 2.40+ | Obvious. |

### Install `uv`

=== "Windows (PowerShell)"
    ```powershell
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```

=== "macOS / Linux"
    ```bash
    curl -LsSf https://astral.sh/uv/install.sh | sh
    ```

Verify:

```bash
uv --version
# uv 0.5.x or later
```

## Accounts you'll need

| Service | Purpose | Free? |
|---|---|---|
| GitHub | Source of truth | Yes |
| Vercel | Frontend deploy | Yes (hobby) |
| Render | Backend deploy | Yes (with cold starts) |
| Cloudflare | R2 artifact storage | Yes (10 GB) |
| HuggingFace | Read token for models/datasets | Yes |
| Sentry (optional) | Error tracking | Yes (5k events/mo) |
| Resend (or SMTP) | Magic-link emails | Yes (3k/mo) |

Generate the HF token now: <https://huggingface.co/settings/tokens> → "New token" → role **Read** → copy and save. We'll use it in [page 08](08-huggingface.md).

## Local services via Docker Compose

Create `infra/docker-compose.yml` at the repo root (we'll do this properly in [page 01](01-repo-layout.md), but you can spin these up standalone today):

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: athena
      POSTGRES_PASSWORD: athena
      POSTGRES_DB: athena
    ports: ["5432:5432"]
    volumes: ["pg:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pg:
```

Start them:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Verify:

```bash
docker compose -f infra/docker-compose.yml ps
# Both services should show "running"
```

## Definition of done

- [ ] `uv --version`, `python --version`, `node --version`, `docker --version` all print versions.
- [ ] Postgres + Redis are running locally.
- [ ] You have an HF read token saved somewhere safe (a password manager, not a `.txt` file).

Next: **[01 · Repo Layout →](01-repo-layout.md)**
