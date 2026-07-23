# TIP

Monorepo for the TIP project, managed with pnpm workspaces and Turborepo.

## Layout

```
apps/
    api/            HTTP API service
    docs/           Documentation pages
    indexer/        Chain/data indexer service
    web/            Web frontend
packages/
    core/           Shared core logic
    db/             Database layer
    sdk/            Client SDK
programs/
    tip-registry/   Solana program (Rust), outside the pnpm workspace
```

`apps/*` and `packages/*` are pnpm workspace members built and orchestrated by Turborepo. `programs/tip-registry` is a Rust program managed separately with its own toolchain (Cargo), not part of the JS workspace.

## Requirements

- Node.js >=24 (see `.nvmrc`)
- pnpm, version pinned via `packageManager` in `package.json`

## Scripts

All scripts delegate to Turborepo:

```
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm format
pnpm clean
```
