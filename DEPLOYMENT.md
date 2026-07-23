# Deploying TIP to Render

This covers `apps/api` (Web Service) and `apps/indexer` (Background Worker).
Both are defined in `render.yaml` at the repo root. This document is
packaging and process guidance only: it does not deploy anything, and it
does not run migrations against any real database.

## Prerequisites

- A Neon Postgres database (or any Postgres reachable over the network).
  Have its connection string ready. A pooled (PgBouncer) connection string
  is recommended if `tip-api` may ever run more than one instance; either
  pooled or direct works fine for `tip-indexer`, which always runs as
  exactly one instance.
- An Upstash Redis database, using its `rediss://` (TLS) connection string.
  Both services share this one Redis instance.
- A Helius API key for devnet RPC access (HTTP and WebSocket).
- The `tip_registry` program already deployed on-chain, and its program id
  (already in `render.yaml`'s shared env var group:
  `4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx`).
- A GitHub (or GitLab) remote for this repository connected to your Render
  account, since Render blueprints deploy from a connected repo.
- pnpm's workspace root `package.json` pins `"packageManager": "pnpm@11.15.1"`.
  The build command runs `corepack enable` first specifically so Render's
  build environment installs and uses that exact pnpm version via corepack,
  rather than whatever pnpm version its base image happens to ship.

## Why explicit build commands instead of `turbo run build`

Turborepo stays available for local development (`pnpm build`,
`pnpm dev`, etc.), but `render.yaml`'s `buildCommand` for both services
runs plain sequential `pnpm --filter` commands instead of `turbo run build`.

Reasons:
- Turbo's dependency graph (`dependsOn: ["^build"]`) already gives the
  correct order locally, but a CI build environment is exactly the place a
  wrong assumption about that graph, an unexpected cache hit, or turbo's
  daemon/telemetry behavior is hardest to debug from a dashboard build log.
- `@tip/db`'s `build` script is `prisma generate && tsc`. Explicit ordering
  makes it unmissable in the build log which step generates the Prisma
  client and which step compiles each package, rather than folded into
  turbo's parallel task output.
- No background daemon process and no interactive telemetry prompt is ever
  possible in the deploy pipeline this way. See the pre-deploy checklist for
  the telemetry setting to use if you choose to run turbo in CI anyway.

The build order, run from the repository root for both services:

```
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @tip/db build      # prisma generate, then tsc
pnpm --filter @tip/core build    # tsc
pnpm --filter @tip/moderation build  # tsc
pnpm --filter @tip/api build     # tsc (or @tip/indexer build for that service)
```

This was verified locally against a cleared `dist`/generated-client state
before writing this document; see the accompanying report for the exact
commands and their output.

## Environment variables

`DATABASE_URL`, `REDIS_URL`, `REDIS_KEY_PREFIX`, and
`TIP_REGISTRY_PROGRAM_ID` are shared between both services via
`render.yaml`'s `tip-shared` env var group. Everything else is
service-specific.

**`REDIS_KEY_PREFIX` must be identical between `tip-api` and
`tip-indexer`.** The blueprint enforces this structurally by sourcing it
from the one shared group rather than letting each service set its own
copy. Do not override it per-service. Use an environment-scoped value
(the blueprint defaults to `tip:devnet:`) so a staging or mainnet
environment sharing the same Redis instance can never collide with this
one's keys.

### Shared (both services, from the `tip-shared` group)

| Variable | Secret | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon Postgres. Use the pooled connection string here; see "Neon connection strings" below. |
| `REDIS_URL` | Yes | Upstash, `rediss://` (TLS). |
| `REDIS_KEY_PREFIX` | No | Defaults to `tip:devnet:`. Must match between services; do not override per-service. |
| `TIP_REGISTRY_PROGRAM_ID` | No | Public program id, not a secret. |

### `tip-api` only

| Variable | Secret | Notes |
| --- | --- | --- |
| `JWT_SECRET` | Yes | Signs session JWTs. |
| `RPC_HTTP_URL` | **Yes** | Embeds the Helius api-key in the URL's query string, so this is credential material, not plain config, even though it looks like an endpoint. Set to the full Helius devnet URL (`https://devnet.helius-rpc.com/?api-key=...`), not just the bare key: `apps/api`'s config has no `HELIUS_API_KEY`-based derivation like the indexer does. |
| `PAYMENT_LINK_BASE_URL` | No | Default `https://tagwise.me`. |
| `AUTH_DOMAIN` | No | Default `tagwise.me`. |
| `AUTH_TOKEN_TTL` | No | Default `1h`. |
| `AUTH_NONCE_TTL` | No | Default `300` (seconds). |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | No | Auth endpoint rate limit. Defaults `60` / `5`. |
| `REGISTER_THROTTLE_TTL` / `REGISTER_THROTTLE_LIMIT` | No | Defaults `60` / `3`. |
| `IDENTITY_UPDATE_THROTTLE_TTL` / `IDENTITY_UPDATE_THROTTLE_LIMIT` | No | Defaults `60` / `10`. |
| `RESOLVE_CACHE_TTL` / `RESOLVE_CACHE_NEGATIVE_TTL` | No | Defaults `300` / `30` (seconds). |
| `PORT` | No | Set by Render itself for web services. Do not set manually. |

### `tip-indexer` only

| Variable | Secret | Notes |
| --- | --- | --- |
| `HELIUS_API_KEY` | Yes | Derives both `RPC_HTTP_URL` and `RPC_WSS_URL` for Helius devnet automatically. Set only this, not the URLs directly. |
| `COMMITMENT` | No | Default `finalized`. |
| `RECONCILE_CRON` | No | Default `0 3 * * *`. |
| `LOG_LEVEL` | No | Default `info`. |

## Neon connection strings

Neon gives you two connection strings for the same database: a **pooled**
one (hostname contains `-pooler`, routes through PgBouncer) and a
**direct** one (no pooler in front).

- **Use the pooled string for `DATABASE_URL` on both running services.**
  Both `tip-api` and `tip-indexer` are long-running processes that open
  connections on startup and keep them, so PgBouncer sits in front of
  Postgres and multiplexes many app-level connections over far fewer real
  Postgres backend connections, which matters most on Neon's free tier
  where the direct connection cap is small.
- **Use the direct string only for `prisma migrate deploy`**, run
  manually per the migration strategy below. Prisma's migration engine
  uses advisory locks and DDL that are not reliably supported through a
  transaction-mode pooler like PgBouncer. Never point a running service's
  `DATABASE_URL` at the direct string, and never run migrations through
  the pooled one.

### Pool size and connection exhaustion

Two services (and potentially more than one `tip-api` instance if you
scale it) each open their own connection pool. `pg.Pool` (what
`@prisma/adapter-pg` uses under the hood here) defaults to a max of 10
connections per pool. On a free-tier Neon instance with a modest total
connection cap, two or three of these default-sized pools can exhaust it
on their own, before you have added any real traffic.

**Recommendation: cap each service's pool to a small number, 3 to 5.**

One important caveat specific to this codebase: the classic Prisma
`?connection_limit=N` query-string parameter is a convention understood
by Prisma's own built-in, engine-managed connection handling. This
project uses `@prisma/adapter-pg` (`packages/db/src/client.ts`), which
hands the connection string to node-postgres's `pg.Pool` directly. `pg`
does not read `connection_limit` from the URL; it would be silently
ignored, not applied. The mechanism that actually works here is passing
an explicit `max` value into the `pg.PoolConfig` object given to
`PrismaPg(...)`, which `createDbClient` does not currently expose as an
option.

Until that small code change is made (out of scope for this
config-and-docs pass), the pooled Neon connection string is the more
effective lever available today: PgBouncer bounds real backend
connections regardless of what each `pg.Pool`'s own unconfigured max is.
Track adding an explicit, small `max` to `createDbClient` as a follow-up
so both mitigations are in place, not just one.

## Migration strategy

`prisma migrate deploy` (via `packages/db`'s `migrate` script,
`pnpm --filter @tip/db migrate`) must run against the real database before
either service's first boot, and again after any deploy that adds a new
migration.

**Recommendation for right now: run it as a manual step, not an automatic
release or pre-deploy command.** Reasoning:

- A migration is a higher-risk, schema-changing action. Wiring it to run
  automatically before the very first deploy, before anyone has watched it
  succeed against this database even once, is the wrong moment to also
  hand that step to an unattended process.
- Run it deliberately, from a machine or CI job with the real
  `DATABASE_URL` (the direct, non-pooled Neon string, see "Neon connection
  strings" above), as its own explicit step:

  ```
  pnpm install --frozen-lockfile
  pnpm --filter @tip/db build
  pnpm --filter @tip/db migrate
  ```

This document does not run this command. Do not run it against a
production database without deliberately intending to.

**Planned next step, not done yet: once this first manual migration
succeeds, move `prisma migrate deploy` into `tip-api`'s Pre-Deploy
Command.** Render runs a service's Pre-Deploy Command before the new
release takes traffic, which is exactly the point in the pipeline a
migration belongs at, and it removes the failure mode where a future
schema change ships in code but the migration to match it is forgotten.
Put this on `tip-api` only, not `tip-indexer` (Prisma migrations are
idempotent, so running it from two places would not be harmful, but there
is no reason to). Do not enable this yet: it is documented here as the
deliberate next step after the first migration has been proven manually,
not as something this pass turns on.

## Deploy order

1. **Migrate.** Run `prisma migrate deploy` against the real database
   manually, per the migration strategy above. Confirm it completes before
   proceeding.
2. **Indexer first.** Deploy `tip-indexer` and let its startup backfill
   reconcile run to completion (see "verifying a healthy deploy" below for
   the log lines to expect) before the API starts serving meaningfully
   fresh data. The API can technically start before the indexer without
   erroring (the mirror simply reflects whatever the indexer last wrote,
   and the chain-fallback cold path covers a gap), but starting the
   indexer first means the mirror is caught up by the time real traffic
   arrives.
3. **API last.** Deploy `tip-api` once the indexer is healthy.

## The single-instance constraint, and why

`tip-indexer` MUST run as exactly one instance. It is the only writer to
the mirror (the `identities` table's on-chain-owned columns, and the
indexer_state cursor), and it applies changes based on the current
database state (a guarded update comparing the incoming slot against the
stored one). Two instances would each independently subscribe to program
account changes, each run their own reconcile sweeps, and each race to
apply the same updates. The guarded update means this would not corrupt
data (an older-slot write is rejected), but it means double the RPC
subscription load, double the reconcile cadence and its associated RPC
cost, and confusing duplicated log lines that look like a bug during
on-call triage.

`render.yaml` pins `numInstances: 1` on the `tip-indexer` service, and
there is no `scaling` block anywhere in that file, for either service.
This is deliberate, not an oversight: Render documents that autoscaling
takes precedence over `numInstances`, so a `scaling` block on this service
would silently defeat the single-instance guarantee, the file would still
say `numInstances: 1` while autoscaling quietly overrode it. Do not add
one. Still, manually confirm in the Render dashboard before every deploy
that this service shows exactly one instance and no scaling configured: a
dashboard click could set this outside of what this file describes, and
that would not be visible here.

`render.yaml` also sets `maxShutdownDelaySeconds: 60` on `tip-indexer`
(Render's default is 30). The shutdown sequence in
`apps/indexer/src/main.ts` runs sequentially: abort the live subscription,
stop the cron task, disconnect Postgres, then quit Redis. The last two are
network round trips to external services, so their combined worst case is
additive. Sixty seconds gives roughly double the default headroom for
that chain under network jitter, while staying well short of the 300
second ceiling.

`tip-api` does not have this constraint. Every piece of state it depends
on (auth nonces, rate limiting, the resolve cache) is Redis-backed, and
its only mirror write path (`PATCH /v1/identity/:tag`) is a plain Postgres
update. Running more than one instance of `tip-api` is safe.

## Region colocation

Put `tip-api` and `tip-indexer` in the same Render region as each other,
and as close as possible to your Neon Postgres region and your Upstash
Redis region. Every request path in this system does at least one
Postgres or Redis round trip (often both), so cross-region latency between
Render and either of those directly adds to response time and to how
quickly the indexer can apply a change.

This blueprint defaults both services to Render's `virginia` region as a
starting point, inferred from a Neon connection string seen during
development being in AWS's `us-east-1`. Confirm your actual Neon project
region and Upstash database region before deploying, and change
`render.yaml`'s `region` field on both services to match if your regions
differ from this default. If Neon and Upstash are not in the same region
as each other, colocate Render with whichever one dominates your request
path (for this system, that is Redis: resolve, the hottest read path,
checks Redis first on every call).

## Verifying a healthy deploy

1. **API health endpoint.** `GET /health` on the deployed API should
   return `{"status":"ok","db":"reachable","redis":"reachable"}`. Both
   dependencies are checked independently, so if one is down you will see
   it named specifically rather than a generic failure.
2. **Indexer startup reconcile.** Check the `tip-indexer` service's logs
   for, in order: `"tip-indexer starting"`, `"running startup backfill
   reconcile"`, `"reconcile: starting full sweep"`, then
   `"reconcile: sweep complete"` with `scanned`/`applied`/`skipped` counts,
   and finally `"subscribed to program notifications"`. All of these are
   structured pino JSON log lines.
3. **A known resolve call.** `GET /v1/resolve/<a tag you know is
   registered>` on the deployed API should return that tag's real wallet
   and payment link, not a 404. This exercises the full path: API to
   Redis (cache miss on first call) to Postgres (the mirror the indexer
   populated) and back.

## Rollback

Render keeps previous deploys for each service and supports rolling back
to one from the dashboard. Two things to know before doing that here:

- Rolling back `tip-api` alone is safe at any time; it has no persisted
  state of its own.
- Rolling back `tip-indexer` to a version older than your most recent
  migration is only safe if that older code is still compatible with the
  current database schema. If a deploy added both a migration and indexer
  code that depends on the new column/table, rolling back the indexer
  without also reverting the migration can make it fail at startup or,
  worse, write incomplete data. Check what changed before rolling back the
  indexer specifically; rolling back the API is comparatively low-risk.
- Never roll back the database itself as a deploy-rollback step. If a
  migration needs undoing, that is its own deliberate, reviewed action,
  not something to fold into rolling back a service deploy.
