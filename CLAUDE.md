# Kenjitsu: agent notes

The source of truth is this repository (`do-box:/root/kenjitsu`, GitHub
`TheBuilderJR/kenjitsu`). Production is https://kenjitsu.expt.sh, hosted by the
vibe-mono platform on omarchy. Read `README.md` for the product and architecture.

- **Test** on omarchy, not do-box (do-box has no app dependencies):
  `python3 /root/vibe-mono/scripts/remote_workspace.py --project kenjitsu -- uv run --no-project --with-requirements requirements.txt python test_app.py`
- **Check JS** locally: `node --check static/app.js`. **Lint** on omarchy:
  `… --project kenjitsu -- uv run --no-project --with ruff ruff check .`
- **Models** go through `providers.py` (API keys and `claude -p` / `codex exec`), chained by
  `KENJITSU_PROVIDERS`. Keep the README's provider tables in sync when adapters change.
- **Deploy** after tests: `bash deploy.sh`. A change to app code, templates or static
  assets isn't finished until it is deployed and `/health` plus the affected route are
  checked. Bump the `?v=` query in `static/index.html` when CSS/JS change; static files
  are served with immutable caching.
- **Never** run `docker compose up/restart` for this service or edit HAProxy maps. The
  helper does the rollout. Live data is `vibe-mono/data/kenjitsu/kenjitsu.db` on omarchy;
  never overwrite it.
- Keep telemetry free of answers, notes and questions. Never print API keys.
- Commit only when asked. Commits made here are separate from deployment.
