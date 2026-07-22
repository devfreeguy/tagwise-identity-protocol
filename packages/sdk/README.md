# @tagwise/tip-sdk

Client SDK for TIP (Tagwise Identity Protocol): a thin, browser-safe client
for the TIP API, plus a direct-chain read path that works with no API at
all.

**Full documentation:** [docs.tagwise.me](https://docs.tagwise.me)

> This package is not published yet.

## Install

```bash
npm install @tagwise/tip-sdk
```

`@tip/core` (the tag-normalization and PDA logic) is bundled into this
package's published output, not a runtime dependency; there is nothing
else to install for it, in this monorepo or from npm.

## Quickstart: resolve a tag

```ts
import { TipClient } from "@tagwise/tip-sdk";

// No arguments needed for the common case: baseUrl defaults to the public
// TIP API.
const tip = new TipClient();

const identity = await tip.resolve("daniel");
console.log(identity.wallet, identity.paymentLink);
```

Point at a different deployment (local development, staging) by passing
`baseUrl` explicitly:

```ts
const tip = new TipClient({ baseUrl: "http://localhost:3000" });
```

`resolve`, `identity`, `availability`, `search`, `qr`, and `paymentLink`
need no authentication. Tags are normalized and validated locally (via
`@tip/core`) before any network call, so a malformed tag throws a
`TagInvalidError` immediately instead of after a round trip:

```ts
import { TagInvalidError } from "@tagwise/tip-sdk";

try {
  await tip.resolve("a"); // too short, never reaches the network
} catch (error) {
  if (error instanceof TagInvalidError) {
    console.log(error.reason); // "TOO_SHORT"
  }
}
```

## The Signer interface

This SDK authenticates and signs through a `Signer`, shaped like a wallet
adapter:

```ts
type Signer = {
  publicKey: string;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
};
```

**The SDK never accepts, stores, or transmits a secret key.** Every call
that needs a signature asks the `Signer` you provide to sign the exact
bytes it needs signed, and only ever reads back a signature. If you are
using a browser wallet adapter (Phantom, Solflare, Backpack, or anything
implementing the standard wallet adapter interface), that adapter already
satisfies this shape.

## Connect and register a tag

```ts
import { TipClient } from "@tagwise/tip-sdk";

const tip = new TipClient();

// `wallet` here is your app's connected wallet adapter instance (Phantom,
// Solflare, etc.), already satisfying the Signer shape above.
const pubkey = await tip.connect(wallet);

// register() returns an UNSIGNED transaction. The SDK never signs or
// submits it for you; that is the wallet adapter's job.
const { transaction, pda, lastValidBlockHeight } = await tip.register({ tag: "daniel" });

// Hand the unsigned transaction to the wallet for signing and submission.
// Exactly how you do this depends on your wallet adapter library; with
// @solana/wallet-adapter-react, for example, it looks roughly like:
//
//   import { getBase64Encoder, getTransactionDecoder } from "@solana/kit";
//   const wireBytes = getBase64Encoder().encode(transaction);
//   const tx = getTransactionDecoder().decode(wireBytes);
//   const signature = await sendTransaction(tx, connection);
//
// The SDK deliberately stops at "here is the unsigned transaction" so your
// wallet adapter stays in full control of signing and submission.
```

If your `Signer` also exposes `signTransaction`, you can opt into a
convenience method that signs and submits for you:

```ts
const { transaction } = await tip.register({ tag: "daniel" });
const signature = await tip.signAndSendTransaction(transaction, wallet);
```

This is optional and separate from `register()`/`updateWallet()` on
purpose: the default is always to hand back the unsigned transaction so
your wallet adapter stays in control.

## Session handling

`connect()` stores the session token in memory only. This SDK never
touches `localStorage`, `sessionStorage`, cookies, or any other browser
storage; if you want the session to survive a page reload, persist
`tip.token` and `tip.connectedPubkey` yourself and restore them with
`tip.setSession(token, pubkey)`.

```ts
// After connect():
localStorage.setItem("tip-token", tip.token!);
localStorage.setItem("tip-pubkey", tip.connectedPubkey!);

// On a later page load:
const token = localStorage.getItem("tip-token");
const pubkey = localStorage.getItem("tip-pubkey");
if (token && pubkey) {
  tip.setSession(token, pubkey);
}
```

If a session has expired, calls to authenticated endpoints reject with an
`UnauthorizedError`. The SDK never silently re-signs to recover (that would
pop a surprise wallet prompt); call `connect()` again instead.

## Editing a profile

```ts
await tip.updateProfile("daniel", {
  displayName: "Daniel",
  bio: "Building on Solana",
});

// Pass null explicitly to clear a field; omit a key to leave it untouched.
await tip.updateProfile("daniel", { avatar: null });
```

## Insufficient balance

`register()` surfaces a 402 (not enough SOL to cover rent and fees) as a
typed error carrying the exact amounts:

```ts
import { InsufficientBalanceError } from "@tagwise/tip-sdk";

try {
  await tip.register({ tag: "daniel" });
} catch (error) {
  if (error instanceof InsufficientBalanceError) {
    console.log(`need ${error.shortfallLamports} more lamports`);
  }
}
```

## Direct chain reads: the protocol property

TIP is a protocol, not just a service. If the API is ever unavailable,
anyone with a Solana RPC endpoint can still resolve a tag straight from the
chain:

```ts
const tip = new TipClient({ rpcUrl: "https://api.devnet.solana.com" });

const onChain = await tip.resolveOnChain("daniel");
```

`resolveOnChain` derives the tag's PDA and decodes the account directly,
with no API involved. It uses `@tip/core`'s `TIP_REGISTRY_PROGRAM_ID` by
default (the real deployed program, the same constant across devnet and
the eventual mainnet deployment); pass `programId` to the `TipClient`
constructor to override it, for example against a local validator:

```ts
const tip = new TipClient({
  rpcUrl: "http://localhost:8899",
  programId: "YourLocalValidatorProgramId11111111111111",
});
```

Only on-chain fields are available on this path (`tag`, `owner`, `wallet`,
`bump`); off-chain profile fields (`displayName`, `avatar`, `bio`,
`preferredToken`) do not exist on-chain and always come back `null`.
`verified` and `merchant` are moderation/mirror-only concepts and always
come back `false` here.

## Validating tags locally

`@tip/core`'s tag rules are re-exported, so you can validate a tag without
this SDK or a network call at all:

```ts
import { normalizeTag, isValidTag, MAX_TAG_LENGTH } from "@tagwise/tip-sdk";

isValidTag("daniel"); // true
normalizeTag("@Daniel"); // { ok: true, tag: "daniel" }
```

## API reference

- `resolve(tag)`, `identity(tag)`, `availability(tag)`, `search(q)`, `qr(tag)`, `paymentLink(tag)`: unauthenticated reads.
- `connect(signer)`: runs challenge, sign, verify, and stores the session token in memory. Returns the authenticated pubkey.
- `challenge(pubkey)` / `verify(pubkey, message, signature)`: the same flow, exposed separately for manual control.
- `token` / `connectedPubkey`: read the current in-memory session.
- `setSession(token, pubkey)`: restore a session you persisted yourself.
- `disconnect()`: clear the in-memory session.
- `register({ tag, wallet? })`: unsigned register_tag transaction. Requires a connected session.
- `updateWallet(tag, newWallet)`: unsigned update_wallet transaction. Requires a connected session.
- `updateProfile(tag, fields)`: off-chain profile update. Requires a connected session.
- `signAndSendTransaction(transaction, signer)`: optional convenience, requires `rpcUrl` and a signer with `signTransaction`.
- `resolveOnChain(tag)`: direct-chain read, requires `rpcUrl`, works with no API. Uses `@tip/core`'s `TIP_REGISTRY_PROGRAM_ID` by default, or the `programId` passed to the `TipClient` constructor.

## What this SDK will never do

- Accept, store, or transmit a private key.
- Read from or write to `localStorage` or any other browser storage.
- Sign or submit a transaction unless you explicitly call `signAndSendTransaction`.
- Silently re-sign or re-authenticate after a session expires.

## Learn more

Full documentation, including concepts (tags, PDAs, ownership), guides
(registering a tag, wallet authentication, resolving without the API), and
a generated API reference, lives at
[docs.tagwise.me](https://docs.tagwise.me).
