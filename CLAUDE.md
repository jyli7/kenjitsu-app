# Kenjitsu: agent notes

The source of truth is this repository (`do-box:/root/kenjitsu`, GitHub
`TheBuilderJR/kenjitsu`). Production is https://kenjitsu.expt.sh. It is self-contained:
`docker-compose.yml` runs two replicas on omarchy, behind do-box's Caddy. Read `README.md`
for the product, architecture and deployment.

- **Test** with `./deploy.sh test`, which runs on the host: do-box has no app dependencies.
  `node --check static/app.js` works locally.
- **Deploy** after tests: `./deploy.sh`. A change to app code, templates or static assets
  isn't finished until it is deployed and `/health` plus the affected route are checked.
  Bump the `?v=` query in `static/index.html` when CSS/JS change; static files are served
  with immutable caching.
- **Models** go through `providers.py` (API keys, and `claude -p` / `codex exec`), chained
  by `KENJITSU_PROVIDERS`. Keep the README's provider tables in sync when adapters change.
- **Never** overwrite the host's `.env` or `data/` (live `kenjitsu.db`). Don't restart replicas
  by hand when `./deploy.sh` would do it one at a time.
- **Routing:** the Caddy block for `kenjitsu.expt.sh` lives in the `vibe-mono` repo's
  `infra/Caddyfile`, since do-box's Caddy serves every site. Follow the validate-backup-reload
  steps there to change it.
- Keep telemetry free of answers, notes and questions. Never print API keys.
- Commit only when asked. Commits made here are separate from deployment.
