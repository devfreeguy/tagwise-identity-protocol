# Tagwise Identity Protocol (TIP)

> An open, non-custodial identity layer on Solana that maps short, human-readable handles (e.g. `@alice`) to wallet addresses and rich off-chain profile metadata.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![pnpm](https://img.shields.io/badge/managed_with-pnpm-orange.svg)](https://pnpm.io)
[![Turborepo](https://img.shields.io/badge/built_with-Turborepo-ef4444.svg)](https://turbo.build)
[![Node.js >=24](https://img.shields.io/badge/node-%3E%3D24-green.svg)](https://nodejs.org)
[![Solana](https://img.shields.io/badge/chain-Solana-9945ff.svg)](https://solana.com)

---

## Why TIP?

- **Human-Readable Handles** — Pay `@alice` instead of copying a 44-character base58 address.
- **Zero Lock-In** — The Solana program's PDAs are the immutable source of truth. Any dApp can resolve tags directly on-chain without the API.
- **Off-Chain Speed & Rich Profiles** — A real-time mirror powers instant search, avatars, bios, and preferred token metadata.
- **Non-Custodial Auth** — Sign-In With Solana (SIWS) ensures zero key exposure.
- **Multi-Asset & Solana Pay** — Built-in support for SOL, SPL tokens, payment links, and QR codes.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Client / dApp                          │
└────────────┬─────────────────────────────────────┬────────────┘
             │  REST API                            │  Direct fallback (RPC)
             ▼                                      ▼
┌────────────────────────┐           ┌──────────────────────────┐
│   apps/api  (NestJS)   │           │   Solana Blockchain       │
│   Redis Cache          │           │   tip_registry program    │
│   PostgreSQL Mirror    │           └──────────────────────────┘
└────────────┬───────────┘                      ▲
             │ sync & invalidate cache           │ watch logs
             ▼                                  │
┌────────────────────────┐                      │
│  apps/indexer          │──────────────────────┘
│  (event listener)      │
└────────────────────────┘
```

---

## Repository Layout

This is a **pnpm + Turborepo** monorepo. All `apps/*` and `packages/*` directories are pnpm workspace members. `programs/tip-registry` is a Rust/Anchor Solana program managed separately with its own Cargo toolchain and is not part of the JS workspace.

```
.
├── apps/
│   ├── api/          HTTP REST API (NestJS + Fastify)
│   ├── docs/         Documentation site (Next.js + Fumadocs)
│   ├── indexer/      On-chain event indexer
│   └── web/          Web frontend
├── packages/
│   ├── core/         Shared business logic (cache keys, utilities)
│   ├── db/           Database layer (Prisma + PostgreSQL)
│   ├── moderation/   Content moderation shared logic
│   └── sdk/          Public TypeScript client SDK (@tagwise/tip-sdk)
└── programs/
    └── tip-registry/ Solana program (Rust/Anchor) — outside the JS workspace
```

---

## Packages

### Applications

| Package | Name | Description |
|---------|------|-------------|
| [`apps/api`](./apps/api) | `@tip/api` | NestJS/Fastify HTTP API. Handles tag resolution, registration, wallet auth (SIWS), profile updates, and payment link generation. Backed by PostgreSQL and Redis. |
| [`apps/docs`](./apps/docs) | `@tip/docs` | Next.js documentation site powered by Fumadocs. Deployed at [docs.tagwise.me](https://docs.tagwise.me). Includes auto-generated REST API reference from OpenAPI. |
| [`apps/indexer`](./apps/indexer) | `@tip/indexer` | Event-driven service that listens to `tip_registry` program logs on-chain, syncs changes to the PostgreSQL mirror, and actively invalidates Redis cache entries. |
| [`apps/web`](./apps/web) | — | Web frontend application. |

### Internal Packages

| Package | Name | Description |
|---------|------|-------------|
| [`packages/sdk`](./packages/sdk) | `@tagwise/tip-sdk` | Public TypeScript/JavaScript client SDK for interacting with the TIP API and resolving tags directly on-chain. Published to npm. |
| [`packages/core`](./packages/core) | `@tip/core` | Shared utilities: cache key builders, protocol constants, and shared types used across `api` and `indexer`. |
| [`packages/db`](./packages/db) | `@tip/db` | Prisma schema, generated client, and database migration utilities. Used by both `api` and `indexer`. |
| [`packages/moderation`](./packages/moderation) | `@tip/moderation` | Shared content moderation logic (word lists, scoring, rule evaluation) used by `api` and `indexer`. |

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | `>=24` | See [`.nvmrc`](./.nvmrc) |
| pnpm | Pinned in `package.json` | Install via `corepack enable` |
| PostgreSQL | Any recent version | Required by `api` and `indexer` |
| Redis | Any recent version | Required by `api` (nonces, rate limits, cache) |
| Solana CLI | Latest stable | Required only for `programs/tip-registry` |

### 1. Clone and install

```bash
git clone https://github.com/devfreeguy/tagwise-identity-protocol.git
cd tagwise-identity-protocol
corepack enable
pnpm install
```

### 2. Configure environment

Each app has its own `.env.example`. Copy and fill in values for the services you are running:

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your DATABASE_URL, REDIS_URL, JWT_SECRET, etc.
```

Key variables for `apps/api`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (`rediss://` for TLS) |
| `JWT_SECRET` | Long random secret for signing session tokens |
| `TIP_REGISTRY_PROGRAM_ID` | Deployed Solana program ID |
| `RPC_HTTP_URL` | Solana RPC endpoint |
| `AUTH_DOMAIN` | Domain shown in wallet sign-in messages |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) |
| `REDIS_KEY_PREFIX` | Must match `apps/indexer` exactly for cache invalidation to work |

See [`apps/api/.env.example`](./apps/api/.env.example) for the full list with detailed descriptions.

### 3. Run development servers

```bash
pnpm dev
```

Turborepo starts all apps concurrently in watch mode, respecting build order.

---

## Scripts

All top-level scripts delegate to Turborepo and run across workspace packages in dependency order.

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in development/watch mode |
| `pnpm build` | Build all packages and apps |
| `pnpm build:docs` | Build only the docs app (generates OpenAPI spec first) |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | TypeScript type-check all packages |
| `pnpm format` | Format all packages |
| `pnpm clean` | Remove all build artifacts |

---

## SDK

The public SDK (`@tagwise/tip-sdk`) is the recommended way to integrate TIP into your application.

```bash
npm install @tagwise/tip-sdk
# or
pnpm add @tagwise/tip-sdk
```

```typescript
import { TipClient } from "@tagwise/tip-sdk";

const client = new TipClient({ baseUrl: "https://api.tagwise.me" });

// Resolve a tag to a wallet address and profile
const profile = await client.resolve("alice");
console.log(profile.wallet); // "4vcgr..."

// Check tag availability
const available = await client.checkAvailability("myhandle");
```

→ Full SDK documentation at [docs.tagwise.me/sdk-reference](https://docs.tagwise.me/sdk-reference)

---

## Documentation

Full protocol documentation is available at **[docs.tagwise.me](https://docs.tagwise.me)**:

| Section | Description |
|---------|-------------|
| [Introduction](https://docs.tagwise.me) | Protocol overview and architectural principles |
| [Protocol Concepts](https://docs.tagwise.me/concepts) | Dual-layer architecture, PDAs, account storage, security model |
| [Quickstart](https://docs.tagwise.me/quickstart) | Up and running in 5 minutes |
| [Integration Guides](https://docs.tagwise.me/integration-guides) | Tag registration, profile updates, wallet auth, Solana Pay QR |
| [SDK Reference](https://docs.tagwise.me/sdk-reference) | Full `@tagwise/tip-sdk` API reference |
| [REST API Reference](https://docs.tagwise.me/api-reference) | OpenAPI HTTP endpoint documentation |

---

## Contributing

Contributions are welcome. Please open an issue first to discuss any significant change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org): `git commit -m 'feat: add my feature'`
4. Push to your branch: `git push origin feat/my-feature`
5. Open a Pull Request

Please ensure `pnpm typecheck` and `pnpm test` pass before submitting.

---

## License

[MIT](./LICENSE) © 2026 [devfreeguy](https://github.com/devfreeguy)
