# TIP Indexer

> @tip/indexer

The TIP mirror sync worker. A single always-on Node process that subscribes
to the deployed tip_registry program, decodes tag account changes, and writes
them into the Postgres mirror via @tip/db.

## Operational constraint: single instance only

**Only one instance of this worker may run at a time.** The out-of-order
guard (comparing incoming slot to the stored lastAppliedSlot) protects
against replaying stale events within one instance's own processing, but it
does not serialize writes across multiple concurrent instances. Running two
copies at once will double-write the mirror and can race on the cursor. This
is a deployment constraint (run this as a single worker slot, not a scaled
replica set), not something enforced in code.

## Pipeline

1. **Decode and verify** (`decode-and-verify.ts`): decode a raw account
   buffer with `@tip/core`'s `decodeTagAccount`, then re-derive the PDA from
   the decoded tag and assert it matches the address the observation arrived
   under. Anything that fails either check is logged and skipped, never
   written.
2. **Guarded mirror upsert** (`apply-change.ts`): upsert the on-chain fields
   only (tag, owner, wallet, bump, lastAppliedSlot). The off-chain profile
   fields and status belong to the API and are never touched here. The
   update is a single conditional `updateMany` so the out-of-order guard is
   enforced atomically in Postgres.
3. **Cursor** (`cursor.ts`): advances the single-row `indexer_state.
   lastProcessedSlot` cursor, also guarded against moving backward.
4. **Cache invalidation seam** (`cache-invalidator.ts`): a `CacheInvalidator`
   interface with an `invalidate(tag)` method, wired into the pipeline so
   every applied change calls it. Only `NoopCacheInvalidator` exists here; the
   Redis-backed implementation lands with the API step.

## Resilience

- **Startup backfill**: before the live subscription starts, a full reconcile
  sweep catches the mirror up to current chain state.
- **Live subscription** (`subscription.ts`): subscribes to program account
  notifications at the configured commitment.
- **Reconnect and gap-heal**: on any websocket close or error, reconnects
  with capped exponential backoff, and runs a reconcile sweep after every
  successful reconnect, since events during the disconnect were missed.
- **Reconcile** (`reconcile.ts`): fetches every tip_registry account via
  `getProgramAccounts` at finalized commitment, filtered by a memcmp on the
  `TagAccount` discriminator. The program has no close instruction, so
  reconcile only upserts, it never deletes.
- **Nightly reconcile**: the same sweep runs on a configurable cron schedule
  as a final safety net.
- **Commitment**: authoritative writes use `finalized` by default, so state
  reorgs below that commitment level are not a concern.
- **Graceful shutdown**: on `SIGINT`/`SIGTERM`, the subscription stops, the
  DB client disconnects, and the process exits cleanly.

## Configuration

All configuration is read from the environment; nothing is hardcoded,
including the program id and the RPC endpoints. See `.env.example`.

## Development

```
pnpm --filter @tip/indexer build
pnpm --filter @tip/indexer typecheck
pnpm --filter @tip/indexer test
```

Tests run without any network access or database; they exercise pure logic
and decoding only.
