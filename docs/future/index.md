# Future

This tab is **design notes, not commitments.** Nothing here is built. Read it when the cloud version is shipping and you want to start thinking about what's next.

## What's in here

- **[Local-First with Tauri](tauri.md)** — wrap the SPA in a Tauri shell, bundle the FastAPI backend as a sidecar binary, replace Postgres with SQLite. Run Athena entirely on a laptop. This is the headline ask in the project brief.
- **[Roadmap](roadmap.md)** — broader feature wishlist beyond Tauri (GPU jobs, model registry, multi-tenancy, plugin SDK, mobile companion).

## When to start

**Not before** the cloud version has:

- Real users (≥ 10 weekly active)
- A stable schema (no breaking migrations in the last month)
- The four tests from page 12 staying green for a full release cycle

Starting Tauri before the cloud product is stable means maintaining two divergent codebases. Don't.
