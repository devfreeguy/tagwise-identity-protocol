# Pre-deploy checklist

Tick these off manually before triggering a real deploy on Render. This
list does not deploy anything by itself; see `DEPLOYMENT.md` for the full
walkthrough behind each item.

## Tooling and CI safety

- [ ] If anything in your CI (GitHub Actions, a local pre-push hook, etc.)
      invokes `turbo` directly, set `TURBO_TELEMETRY_DISABLED=1` in that
      CI's environment first. Turbo's first run in a non-interactive shell
      shows an interactive telemetry consent prompt that can hang the
      whole job waiting for input that will never come. Render's own
      build command in `render.yaml` does not invoke turbo at all (see
      DEPLOYMENT.md for why), so this specifically matters for any other
      pipeline that does, not for the Render build itself.
- [ ] Confirm `pnpm-workspace.yaml`'s `allowBuilds` section has valid
      boolean values for every key (`true` or `false`), not a placeholder
      string. pnpm can write an invalid placeholder here automatically
      when a new dependency needs build-script approval and nothing is
      available to answer that prompt; an invalid value breaks pnpm's own
      internal dependency checks, which will break the Render build too.

## Build verification

- [ ] From a clean `node_modules`/`dist` state, run, from the repo root:
      `pnpm install --frozen-lockfile`, then
      `pnpm --filter @tip/db build`, `pnpm --filter @tip/core build`, `pnpm --filter @tip/moderation build`,
      `pnpm --filter @tip/api build`, `pnpm --filter @tip/indexer build`.
      All five should complete with no errors, and `packages/db` should
      show `prisma generate` running before its `tsc` step.
- [ ] Confirm `apps/api/dist/main.js` and `apps/indexer/dist/main.js`
      exist and that `node apps/api/dist/main.js` /
      `node apps/indexer/dist/main.js`, run from the repo root, fail only
      on a missing environment variable (not a module resolution error).
      A module resolution error here means the workspace packages are not
      being found and the build will fail the same way on Render.

## render.yaml and secrets

- [ ] Every `sync: false` variable in `render.yaml` (`DATABASE_URL`,
      `REDIS_URL`, `JWT_SECRET`, `RPC_HTTP_URL` on `tip-api`,
      `HELIUS_API_KEY` on `tip-indexer`) has a real value entered directly
      in the Render dashboard. None of these are in any committed file.
- [ ] `tip-api`'s `RPC_HTTP_URL` is set to the full Helius devnet URL
      (`https://devnet.helius-rpc.com/?api-key=<key>`), not just the bare
      key. `apps/api`'s config only reads `RPC_HTTP_URL` directly; unlike
      `apps/indexer` it has no `HELIUS_API_KEY`-based derivation.
- [ ] `REDIS_KEY_PREFIX` (in the shared `tip-shared` env var group) is set
      to an environment-scoped value, for example `tip:devnet:`, and you
      have not overridden it separately on either service.
- [ ] `region` on both services matches (or is deliberately close to) your
      actual Neon Postgres region and Upstash Redis region, not left at
      this file's placeholder guess.
- [ ] `plan` on both services reflects the tier you actually intend to
      pay for; this file uses `starter` as a placeholder.

## Database

- [ ] `prisma migrate deploy` has been run manually against the real
      target database (see DEPLOYMENT.md's migration strategy) and
      completed without error, before either service's first deploy.
- [ ] You have not run this, or any other write, against a production
      database as part of this preparation work.

## Single-instance constraint

- [ ] After first deploy, manually confirm in the Render dashboard that
      `tip-indexer` shows exactly one running instance and no autoscaling
      is enabled. This file sets `numInstances: 1`, but a dashboard-side
      change would not be visible in this file.

## Final scope check

- [ ] `git diff` shows only `render.yaml`, `DEPLOYMENT.md`,
      `PRE_DEPLOY_CHECKLIST.md` (all new, repo root), one small fix to
      `pnpm-workspace.yaml` (an invalid placeholder value pnpm had written
      into `allowBuilds` corrected to a real boolean, see above), and no
      changes to application source, `packages/db`'s schema, the root
      TypeScript pin, or `tsconfig.base.json`.
- [ ] No `.env` file, and no real credential, appears in anything staged
      for commit.
