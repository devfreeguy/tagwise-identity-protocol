#!/usr/bin/env bash
# Deploys apps/api and apps/indexer on the OCI server. Run from
# /opt/apps/tagwise (or anywhere; it cds there itself), with IMAGE_OWNER,
# REPO_NAME, and IMAGE_TAG set in the environment -- the GitHub Actions
# deploy job sets these before invoking this script over SSH.
#
# Deliberately scoped to api/indexer only: never mentions postgres, redis,
# or migrator, never runs `docker compose down`, and never runs a bare
# `docker compose up` without a service list. deploy/compose.yml has no
# postgres/redis service block at all -- postgres and redis are
# external, pre-existing infrastructure this script cannot touch even by
# accident. See deploy/compose.yml's header comment.
set -euo pipefail

# This script is deployed to /opt/apps/tagwise/deploy/scripts/deploy.sh; compose.yml
# and .env live two levels up, at /opt/apps/tagwise/.
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

: "${IMAGE_OWNER:?IMAGE_OWNER must be set}"
: "${REPO_NAME:?REPO_NAME must be set}"
: "${IMAGE_TAG:?IMAGE_TAG must be set}"

if [ ! -f .env ]; then
  echo "!! /opt/apps/tagwise/.env is missing. Create it from deploy/.env.example" \
       "before the first deploy (see deploy/README.md)." >&2
  exit 1
fi

export IMAGE_OWNER REPO_NAME IMAGE_TAG

echo "==> Deploying api/indexer at tag ${IMAGE_TAG}"

docker compose -f compose.yml --env-file .env pull api indexer

# tip-api/tip-indexer may still be the original manually-created containers
# (not tracked as belonging to this Compose project), which `docker compose
# up --force-recreate` cannot adopt or replace -- it only recreates
# containers Compose itself created. Removing them by their exact, fixed
# names (set via compose.yml's container_name:) and letting `up` create
# fresh Compose-managed ones in their place is what performs that one-time
# adoption; it is also exactly what every subsequent deploy does, so this
# is not a special first-run path. Named removal only, nothing broader:
# never `docker compose down`, never `--remove-orphans`, and this can only
# ever affect these two exact container names -- never postgres,
# redis, or anything else on the host. Runs only after the pull
# above succeeds (set -euo pipefail stops the script at the pull if it
# fails, before this line is ever reached).
docker rm -f tip-api tip-indexer

docker compose -f compose.yml --env-file .env up -d --no-deps api indexer

# Waits for GET /health to report BOTH dependencies reachable, not just a
# 200 status code: the endpoint always answers 200, with db/redis
# reachability reported independently in the body (see
# apps/api/src/health/health.controller.ts), so a status-code-only check
# would treat a fully degraded API as a successful deploy.
echo "==> Waiting for the API to become healthy..."
attempts=30
until
  body=$(curl --silent --fail http://127.0.0.1:3000/health 2>/dev/null) &&
  grep -q '"db":"reachable"' <<<"${body}" &&
  grep -q '"redis":"reachable"' <<<"${body}"
do
  attempts=$((attempts - 1))
  if [ "${attempts}" -le 0 ]; then
    echo "!! API did not become healthy in time. Recent logs:" >&2
    docker compose -f compose.yml logs --tail=100 api >&2
    echo "!! Deployment FAILED at tag ${IMAGE_TAG}. Previous containers were" \
         "replaced; roll back with the same command using a known-good" \
         "IMAGE_TAG (see deploy/README.md)." >&2
    exit 1
  fi
  sleep 2
done

echo "==> API healthy: ${body}"

# apps/indexer has no HTTP surface (see deploy/compose.yml), so "healthy"
# for it means the container is actually running, not exited/restarting.
echo "==> Verifying tip-indexer is running..."
indexer_state=$(docker inspect --format '{{.State.Running}}' tip-indexer 2>/dev/null || echo "false")
if [ "${indexer_state}" != "true" ]; then
  echo "!! tip-indexer is not running. Recent logs:" >&2
  docker compose -f compose.yml logs --tail=100 indexer >&2
  echo "!! Deployment FAILED at tag ${IMAGE_TAG}. api was already replaced;" \
       "roll back both with the same command using a known-good IMAGE_TAG" \
       "(see deploy/README.md)." >&2
  exit 1
fi
echo "==> tip-indexer running."

echo "==> Deployment succeeded at tag ${IMAGE_TAG}"
