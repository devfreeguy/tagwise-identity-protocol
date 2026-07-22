# Deploying apps/docs

This is a separate deploy from `apps/api` and `apps/indexer`. Those deploy
to Render via the root `render.yaml`; this deploys to Vercel and is
deliberately not part of that blueprint.

## Why the OpenAPI file must be regenerated before every docs build

`apps/docs`'s API Reference section is generated entirely from
`apps/api/openapi.json`. That file is not committed (see `apps/api/.gitignore`)
and is not the docs app's to produce: it is a build artifact of `apps/api`,
written by `pnpm --filter @tip/api export:openapi`. If the docs build ever
ran without regenerating it first, either the reference would be missing
entirely (first build, no file yet) or it would silently describe an
older version of the API than the one actually deployed. Both `vercel.json`
below and the pre-flight checklist wire this so it cannot be skipped.

## Build chain, in order

1. `pnpm --filter @tip/db build` (prisma generate + tsc; apps/api depends on it)
2. `pnpm --filter @tip/core build` (apps/api and the SDK both depend on it)
3. `pnpm --filter @tagwise/tip-sdk build` (apps/docs depends on it for typechecked code samples)
4. `pnpm --filter @tip/api build` (compiles apps/api, including the export script)
5. `pnpm --filter @tip/api export:openapi` (writes `apps/api/openapi.json`)
6. `pnpm --filter @tip/docs build` (regenerates the API Reference MDX from that file, then runs `next build`)

Step 6 is a single command from Vercel's point of view, but internally runs
`generate:openapi` (`fumadocs-openapi`'s `generateFiles`, reading
`apps/api/openapi.json`) before `next build`, so the reference is always
built from whatever is in that file at that moment, never a stale copy.

No step in this chain uses `turbo run build`, for the same reason
`render.yaml` does not: an explicit, deterministic sequence of
`pnpm --filter` commands has no interactive telemetry prompt to hang a
non-interactive build shell on.

## Vercel project settings

- **Root Directory:** `apps/docs`
- **Framework Preset:** Next.js
- **Install Command / Build Command:** set via `vercel.json` in this
  directory (see below), not the dashboard, so they are version controlled
  alongside the app.

`vercel.json` in this directory:

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && corepack enable && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @tip/db build && pnpm --filter @tip/core build && pnpm --filter @tagwise/tip-sdk build && pnpm --filter @tip/api build && pnpm --filter @tip/api export:openapi && pnpm --filter @tip/docs build",
  "outputDirectory": ".next"
}
```

`cd ../..` moves from the Root Directory back to the monorepo root so
`pnpm --filter` can see the whole workspace; this is Vercel's own
documented pattern for monorepo install/build commands (see Vercel's
Turborepo deployment guide), not specific to Turborepo itself.

## Environment variables

This app makes no server-side calls to the TIP API or Solana RPC at
request time (the API Reference is generated at build time and the
Quickstart samples are static code, not live calls). No environment
variables are required for the docs site itself.

## Domain

`docs.tagwise.me`, configured as a custom domain on this Vercel project.

## Local development

`pnpm --filter @tip/docs dev` also runs `generate:openapi` first (see
`package.json`), so `apps/api/openapi.json` must already exist locally.
Build and export it once before the first `dev` run:

```bash
pnpm --filter @tip/db build
pnpm --filter @tip/core build
pnpm --filter @tip/api build
pnpm --filter @tip/api export:openapi
pnpm --filter @tip/docs dev
```
