# Production deployment (self-hosted OCI + Docker + GitHub Actions)

Covers `apps/api` and `apps/indexer`, deployed as Docker containers on an
Ubuntu 24.04 OCI VM, built and pushed by GitHub Actions to GHCR, with the
host's existing Caddy install handling TLS/routing. This is separate from
(and does not touch) the existing Render deployment described in
`DEPLOYMENT.md` at the repo root.

## Immutable infrastructure -- read this first

`infra-postgres` and `infra-redis` are pre-existing containers holding
real production data, running independently of everything in this
directory. **Nothing in this repository creates, recreates, renames,
stops, removes, or reconfigures them, their volumes, their network, their
credentials, or Caddy/DNS.** `deploy/compose.yml` has no `postgres` or
`redis` service block at all -- not "manages them carefully," genuinely
absent, so there is no service name for a stray command to accidentally
target. `deploy/scripts/deploy.sh` only ever runs
`docker compose ... up -d --no-deps --force-recreate api indexer`; it
never runs `docker compose down`, never a bare `docker compose up`, and
never names `postgres`, `redis`, or a volume.

The only two containers this pipeline ever creates, replaces, or removes
are `tip-api` and `tip-indexer`.

## Architecture

```
git push production
        |
        v
GitHub Actions (.github/workflows/deploy-production.yml)
  1. typecheck + test
  2. docker build --target {api,indexer,migrator}, push to GHCR
  3. rsync deploy/compose.yml + deploy/scripts/ to the server (never .env)
  4. ssh: deploy/scripts/deploy.sh -- pulls + recreates ONLY api/indexer,
     verifies api health and indexer running state
        |
        v
OCI server: /opt/tagwise/
  compose.yml          <- synced from deploy/compose.yml every deploy
  .env                 <- created once by hand, never touched by CI
  deploy/scripts/*.sh  <- synced every deploy
        |
        v
  docker compose (project "tagwise", services: api, indexer, migrator)
    api, indexer  <-- recreated on every deploy, attached to the
                       pre-existing `infra` network (external: true)
        |                                    |
        v                                    v
Caddy (host) --TLS--> 127.0.0.1:3000    infra-postgres, infra-redis
  (unchanged; not part of this repo)      (external, untouched;
  for api.tagwise.me and tip.tagwise.me    already running, already
                                            holding real data)
```

## Required GitHub secrets

Set these under the repo's `production` environment (Settings -> Environments
-> production -> Environment secrets), or as repo-level secrets if you don't
use environments:

| Secret | Used for |
| --- | --- |
| `OCI_HOST` | Server IP or hostname, for SSH and `ssh-keyscan`. |
| `OCI_SSH_USER` | SSH username the deploy key logs in as (see setup below). |
| `OCI_SSH_PRIVATE_KEY` | Private half of a dedicated deploy keypair. Never your personal key. |

No GHCR-specific secret is needed for GitHub Actions itself -- the workflow
uses the ambient `GITHUB_TOKEN` (via `packages: write` permission) to push
images. The server needs its own separate, one-time GHCR login to pull
them back down (GHCR packages from a private repo are private by default);
that's a personal access token set up directly on the server, not a GitHub
Actions secret -- see "first-time server setup" below.

Nothing else is a GitHub secret. Application secrets (`DATABASE_URL`,
`JWT_SECRET`, `RPC_HTTP_URL`, `HELIUS_API_KEY`, etc.) live only in the
server's `/opt/tagwise/.env`, which GitHub Actions never reads or writes.

## Connecting to the existing Postgres/Redis

**Confirmed via production inspection** (`docker inspect tip-api` /
`infra-postgres` / `infra-redis`), not assumed:

- `infra-postgres` and `infra-redis` both run on a Docker network named
  `infra`; `tip-api`/`tip-indexer` reach them by container-name DNS on
  that network, not a published host port.
- `DATABASE_URL` is `postgresql://tip_user:<password>@infra-postgres:5432/tip_db`.
- `REDIS_URL` is `redis://:<password>@infra-redis:6379`.
- `REDIS_KEY_PREFIX` is `tip:`.

The passwords are real production credentials and were deliberately not
captured anywhere in this repository -- `deploy/.env.example` has the
confirmed host/port/user/database shape above with only the password
portion left as a placeholder; fill that in directly on the server, in
`/opt/tagwise/.env` only. `EXISTING_INFRA_NETWORK` in `.env.example` is
already set to `infra` for the same reason (not a secret, so safe to
record directly).

If this server is ever re-provisioned, or you're setting up a second
environment, re-derive these instead of reusing the values above:

```
docker inspect tip-api --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E 'DATABASE_URL|REDIS_URL|REDIS_KEY_PREFIX'
docker inspect tip-api --format '{{json .NetworkSettings.Networks}}'
docker inspect infra-postgres --format '{{json .NetworkSettings.Networks}}'
docker inspect infra-redis --format '{{json .NetworkSettings.Networks}}'
```

Two possible shapes, depending on what that shows:

- **Shared Docker network** (most likely, if `infra-postgres`/`infra-redis`
  publish no host port): `tip-api`, `tip-indexer`, `infra-postgres`, and
  `infra-redis` are all attached to the same user-defined bridge network,
  and `DATABASE_URL`/`REDIS_URL` use the container names
  (`infra-postgres`, `infra-redis`) as hostnames -- Docker's embedded DNS
  resolves those on a user-defined network. Set
  `EXISTING_INFRA_NETWORK` in `/opt/tagwise/.env` to that network's name
  (the key `docker inspect infra-postgres`'s `NetworkSettings.Networks`
  prints), and `deploy/compose.yml`'s `networks: infra: external: true`
  block attaches `api`/`indexer` to it unchanged.
- **Published host port**: `infra-postgres`/`infra-redis` publish a port
  to the host (or the loopback interface), and `DATABASE_URL`/`REDIS_URL`
  point at `localhost`/`127.0.0.1`/a host IP instead of a container name.
  In this case, remove the `networks:` block from `deploy/compose.yml`'s
  `api`/`indexer`/`migrator` services entirely (they don't need to share a
  Docker network with infra containers reachable over the host network
  namespace) and leave `EXISTING_INFRA_NETWORK` unset in `.env`.

Either way: copy `DATABASE_URL`, `REDIS_URL`, and `REDIS_KEY_PREFIX`
**verbatim** from `tip-api`'s current environment into
`/opt/tagwise/.env` -- don't reconstruct them. This guarantees the new
containers reach the exact same database and cache instance the old ones
did, with the exact same behavior.

## First-time server setup (run once, by hand)

1. **Install Docker** if not already present, and confirm
   `docker compose version` works. Also `apt-get install -y rsync curl`.
   (Almost certainly already done, since `tip-api`/`infra-postgres`/etc.
   are already running -- skip if so.)

2. **Create a dedicated deploy user** (or reuse an existing one) that is a
   member of the `docker` group, with SSH key-only auth:
   ```
   adduser --disabled-password deploy
   usermod -aG docker deploy
   mkdir -p /home/deploy/.ssh
   # append the PUBLIC half of a new, dedicated keypair to:
   #   /home/deploy/.ssh/authorized_keys
   chown -R deploy:deploy /home/deploy/.ssh
   chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
   ```
   Put the matching private key in the `OCI_SSH_PRIVATE_KEY` GitHub secret,
   and `deploy` in `OCI_SSH_USER`. Disable password SSH auth entirely if it
   isn't already.

3. **Create the deploy directory:**
   ```
   mkdir -p /opt/tagwise/deploy/scripts
   chown -R deploy:deploy /opt/tagwise
   ```

4. **Create `/opt/tagwise/.env`** from `deploy/.env.example` in this repo
   (copy its contents over SSH or SFTP, don't clone the whole repo onto the
   server for this). `EXISTING_INFRA_NETWORK` and `REDIS_KEY_PREFIX` are
   already filled in with confirmed values; fill in the password portion
   of `DATABASE_URL` and `REDIS_URL` (see "Connecting to the existing
   Postgres/Redis" above) -- every other value, fill in as normal (new
   secrets are fine for `JWT_SECRET` etc.,
   or copy `tip-api`'s existing ones if you want zero behavior change).
   `chmod 600` it. This file is never created or modified by CI/CD after
   this point.

5. **Log in to GHCR from the server** so `docker compose pull` can fetch
   images (GHCR images pushed from a private repo are private by default):
   ```
   echo "$A_GITHUB_PAT_WITH_read:packages" | docker login ghcr.io -u <your-github-username> --password-stdin
   ```
   Use a fine-scoped personal access token (classic PAT with `read:packages`,
   or a fine-grained token with the equivalent), not your primary password.
   This login persists in the deploy user's Docker config; it's a one-time
   step, not something GitHub Actions repeats on every deploy.

6. **Copy `deploy/compose.yml`** from this repo to `/opt/tagwise/compose.yml`
   once by hand, so the very first deploy has something to work with.
   Every subsequent push to `production` re-syncs it automatically.

7. Trigger a deploy (push to `production`) and confirm `tip-api`/
   `tip-indexer` come up healthy per "Inspecting logs and health" below,
   while `infra-postgres`/`infra-redis`/Caddy remain untouched (`docker ps`
   shows the same container IDs for those two, unchanged uptime).

## How deployment works

1. Push (or merge) to the `production` branch.
2. `verify` job: `pnpm install --frozen-lockfile`, builds `@tip/db`
   (needed for typecheck across the workspace), then `pnpm typecheck` and
   `pnpm test`. A failure here stops the deploy before anything is built.
3. `build-and-push` job: builds `api`, `indexer`, and `migrator` from the
   root `Dockerfile` (`docker build --target <name> --build-arg
   APP=<api|indexer>`), pushes each to
   `ghcr.io/<owner>/<repo>-<name>:<git-sha>` and also retags it
   `ghcr.io/<owner>/<repo>-<name>:production` (a floating pointer at the
   most recently built image -- the deploy itself always uses the
   immutable SHA tag, never `production` or `latest`, so this floating tag
   is purely a convenience label for humans/tooling that want "whatever's
   current").
4. `deploy` job: rsyncs `deploy/compose.yml` and `deploy/scripts/` to the
   server (never `.env`), then runs `deploy/scripts/deploy.sh` over SSH,
   which:
   - `docker compose pull api indexer` (SHA-tagged images only)
   - `docker compose up -d --no-deps --force-recreate api indexer`
   - polls `GET http://127.0.0.1:3000/health` for up to ~60s, requiring
     `"db":"reachable"` AND `"redis":"reachable"` in the response body (a
     200 status code alone isn't enough -- `/health` always returns 200
     even when a dependency is down; see
     `apps/api/src/health/health.controller.ts`) -- proof the new `tip-api`
     can actually reach the existing Postgres/Redis, not just that it
     started
   - checks `docker inspect --format '{{.State.Running}}' tip-indexer`
   - exits non-zero (failing the GitHub Actions job) if either check
     fails, after printing the last 100 lines of the relevant container's
     logs

Nothing in this sequence names `infra-postgres`, `infra-redis`, or Caddy.
`apps/indexer`'s existing graceful `SIGTERM` handling (abort subscription,
stop cron, disconnect Postgres, then Redis) is preserved unchanged;
`--force-recreate` sends `SIGTERM` and waits up to `stop_grace_period: 65s`
(see `deploy/compose.yml`) before a hard kill.

## Manual rollback

Every image is immutably tagged by commit SHA and never garbage collected
by this pipeline. Rollback replaces only `tip-api`/`tip-indexer`, exactly
like a normal deploy:

```
ssh <user>@<host>
cd /opt/tagwise
IMAGE_OWNER=<owner> REPO_NAME=<repo> IMAGE_TAG=<previous-good-sha> \
  bash deploy/scripts/deploy.sh
```

Find `<previous-good-sha>` from `git log production` or the GHCR package
versions page. This runs the exact same pull/recreate/health-gate sequence
as a normal deploy, just pointed at an older tag -- there is no separate
"rollback mode," and it never touches `infra-postgres`/`infra-redis`
either, same as any other run of this script.

## Inspecting logs and health

```
# tip-api / tip-indexer status (includes Docker-level HEALTHCHECK state for api)
docker compose -f /opt/tagwise/compose.yml ps

# tip-api / tip-indexer logs
docker compose -f /opt/tagwise/compose.yml logs -f api
docker compose -f /opt/tagwise/compose.yml logs -f indexer

# infra-postgres / infra-redis are NOT in this compose file -- inspect them
# with plain docker commands, same as before this pipeline existed:
docker logs -f infra-postgres
docker logs -f infra-redis
docker ps --filter name=infra-postgres --filter name=infra-redis

# API health, from the server itself (127.0.0.1:3000 is not public)
curl -s http://127.0.0.1:3000/health | jq
# -> {"status":"ok","db":"reachable","redis":"reachable"}

# Indexer startup health: apps/indexer has no HTTP endpoint or Docker
# HEALTHCHECK (see the Dockerfile's indexer stage for why); confirm it's
# healthy by log content instead, in order:
#   "tip-indexer starting"
#   "running startup backfill reconcile"
#   "reconcile: sweep complete" (with scanned/applied/skipped counts)
#   "subscribed to program notifications"
```

## Running migrations

`prisma migrate deploy` needs the `prisma` CLI, which the `api`/`indexer`
runtime images deliberately don't carry. A separate `migrator` image (built
`FROM builder`, so it has the CLI and the full `packages/db/prisma/`
directory) is built and pushed alongside `api`/`indexer` on every deploy,
but is **never run automatically**, and never touches anything but the
existing database's schema via the same `DATABASE_URL` `tip-api` already
uses. Run it deliberately, after confirming `/opt/tagwise/.env`'s
`DATABASE_URL` is correct:

```
cd /opt/tagwise
IMAGE_OWNER=<owner> REPO_NAME=<repo> IMAGE_TAG=<sha> docker compose -f compose.yml --env-file .env --profile tools pull migrator
IMAGE_OWNER=<owner> REPO_NAME=<repo> IMAGE_TAG=<sha> docker compose -f compose.yml --env-file .env --profile tools run --rm migrator
```

This connects to the existing `infra-postgres` the same way `tip-api`
does (via `DATABASE_URL` and, if applicable, the `EXISTING_INFRA_NETWORK`
attachment) -- it does not need a public database port. Per the project's
existing migration policy (see `DEPLOYMENT.md`), this stays a deliberate,
manual, reviewed action, not something any pipeline runs unattended.
