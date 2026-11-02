#!/usr/bin/env bash
# Deploy to production (https://kenjitsu.expt.sh). Kenjitsu is hosted by the vibe-mono
# platform on omarchy: its adapter syncs this repository to the execution host, builds
# the image and promotes it through the zero-downtime two-slot rollout.
set -euo pipefail
platform=${VIBE_MONO:-/root/vibe-mono}
exec bash "$platform/apps/kenjitsu/deploy.sh" "$@"
