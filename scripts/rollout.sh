#!/usr/bin/env bash
# Runs on the production host (deploy.sh calls it): build the image, then replace the two
# replicas one at a time, waiting for each to be healthy. While one restarts, Caddy sends
# traffic to the other. If a new replica never becomes healthy, this stops and the other
# replica keeps serving.
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -f .env ]] || { echo "Missing .env (copy .env.example and add a provider key)" >&2; exit 1; }
mkdir -p data
# The container runs as uid 10001 and owns its SQLite database.
docker run --rm -v "$PWD/data:/data" alpine:3.22 chown 10001:10001 /data
docker compose build kenjitsu-a

healthy() {
    local port=$1 ok=0
    for _ in $(seq 60); do
        if curl -fsS -o /dev/null 2>/dev/null "http://${KENJITSU_BIND:-127.0.0.1}:$port/health"; then
            ok=$((ok + 1)); (( ok >= 3 )) && return 0
        else
            ok=0
        fi
        sleep 1
    done
    return 1
}

set -a; source .env; set +a
for replica in a b; do
    port=$([[ $replica == a ]] && echo 19140 || echo 19141)
    echo "Replacing kenjitsu-$replica"
    docker compose up -d --no-build --no-deps --force-recreate "kenjitsu-$replica"
    healthy "$port" || { echo "kenjitsu-$replica is unhealthy; stopping here" >&2; exit 1; }
done
docker image prune -f --filter "dangling=true" >/dev/null
echo "Deployed: $(docker inspect -f '{{.Image}}' kenjitsu-a | cut -c1-19)"
