#!/usr/bin/env bash
# Production helper for https://kenjitsu.expt.sh, run from a checkout with SSH access to the
# host (do-box). Collaborators without access open a pull request instead.
#
#   ./deploy.sh          sync this checkout to the host, build, rolling restart
#   ./deploy.sh status   replica state
#   ./deploy.sh logs [N] last N log lines from both replicas
#   ./deploy.sh test     sync, then run the tests and lint on the host
set -euo pipefail
cd "$(dirname "$0")"
host=${KENJITSU_HOST:-thebuilderjr@100.83.44.20}
dir=${KENJITSU_DIR:-/home/thebuilderjr/Projects/kenjitsu}

sync() {
    # Tracked and untracked source only: never the host's .env or data/.
    git ls-files -z --cached --others --exclude-standard |
        rsync -az --delete-missing-args --from0 --files-from=- ./ "$host:$dir/"
}
remote() { ssh -o BatchMode=yes "$host" "cd $dir && $1"; }

case "${1:-deploy}" in
    deploy) sync; remote ./scripts/rollout.sh ;;
    status) remote "docker compose ps" ;;
    logs) remote "docker compose logs --tail=${2:-100}" ;;
    test) sync; remote "uv run --no-project --with-requirements requirements.txt python test_app.py \
        && uv run --no-project --with ruff ruff check ." ;;
    *) echo "usage: $0 [deploy|status|logs [N]|test]" >&2; exit 2 ;;
esac
