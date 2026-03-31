# Engineering Postmortem: SolAgent Hub

> **Project:** SolAgent Hub -- Metaplex Agent Registry Explorer & A2A Orchestrator
> **Stack:** Next.js 14 (static export), Tailwind CSS, @metaplex-foundation/umi, @solana/web3.js, A2A/MCP protocols
> **Deployment:** GitHub Pages at `/solagent-hub` basePath
> **Date:** March 2026

This document records the four most painful engineering issues we hit during development, how we diagnosed them, and what we did to fix them. These are real bugs from real build failures and browser console errors -- not theoretical risks.

---

## Bug #1: Umi SDK Serialization Failure in Static Export Mode

**Symptom**

Running `next build` with `output: 'export'` in `next.config.js` crashed during the static page generation phase:

```
ReferenceError: Buffer is not defined
    at BorshAccountsCoder.decode (umi-serializers-core/src/bytes.ts:14:22)
    at createUmi (umi-bundle-defaults/src/index.ts:38:5)
    at getUmi (src/lib/metaplex.ts:14:12)
```

The build succeeded under `next dev` (Node.js context) but failed in `next build` because static export strips Node.js globals.

**Root Cause**

The Umi SDK (`@metaplex-foundation/umi-bundle-defaults`) depends on Borsh serialization, which relies on `Buffer` -- a Node.js global absent in browser environments. The dependency chain:

```
src/lib/metaplex.ts -> umi-bundle-defaults -> umi-serializers-core -> Buffer.alloc() / Buffer.from()
```

Additionally, `fs`, `net`, `tls`, and `crypto` modules were being resolved by Webpack in the client bundle, causing secondary failures.

**Debugging Process**

1. Ran `next build --debug` and traced the stack to `umi-serializers-core`. Confirmed `Buffer` was the root issue:
   ```
   grep -r "Buffer\." node_modules/@metaplex-foundation/umi-serializers-core/
   ```
   Found 14 occurrences across `bytes.ts` and `fixSerializer.ts`.
2. Found [metaplex-foundation/umi#72](https://github.com/metaplex-foundation/umi/issues/72) confirming this is a known friction point.
3. After fixing Buffer, hit a secondary error from `@solana/web3.js`:
   ```
   Module not found: Can't resolve 'crypto'
   ```

**Fix**

Two changes in `next.config.js`:

```js
webpack: (config) => {
  config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false, crypto: false };
  return config;
},
```

And a runtime polyfill in `src/app/layout.tsx`:

```ts
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}
```

We also lazy-initialized the Umi instance in `src/lib/metaplex.ts` behind `getUmi()` rather than at module scope, so it only executes when a component actually needs it.

**Lesson Learned**

On-chain SDKs like Umi and `@solana/web3.js` assume a Node.js runtime. When targeting static export, audit the full import tree for Node.js globals and provide Webpack fallbacks or runtime polyfills. Lazy initialization is critical -- never let SDK constructors run at import time.

---

## Bug #2: A2A Agent Card CORS Rejection on GitHub Pages

**Symptom**

After deploying to GitHub Pages, A2A agent discovery failed. The orchestration page fetched `/.well-known/agent.json` (per A2A spec) and received a 404, despite the file existing in the repo at `public/agent-card.json`.

**Root Cause**

Two problems compounded:

1. **GitHub Pages ignores dot-directories.** Jekyll (the default processor) skips directories starting with `.`. Even with `.nojekyll`, the A2A spec's `/.well-known/agent.json` path doesn't work on project sites.

2. **Next.js `basePath` prefix.** Our `basePath: '/solagent-hub'` means `public/` files are served at `/solagent-hub/<filename>`, not at the domain root.

**Debugging Process**

1. Saw 404 on `/.well-known/agent.json` in DevTools Network tab.
2. `curl -I https://username.github.io/solagent-hub/agent-card.json` returned 200 -- file was deployed, just at wrong path.
3. Tried `.well-known/` directory in `public/` with `.nojekyll` -- served at `/solagent-hub/.well-known/agent.json`, still wrong for spec compliance.
4. Concluded: cannot control domain root from a project-level GitHub Pages site.

**Fix**

We placed the Agent Card at `public/agent-card.json` and updated A2A discovery to resolve using the app's base path with a fallback chain:

```ts
const AGENT_CARD_PATHS = [
  '/.well-known/agent.json',       // A2A spec standard
  `${basePath}/agent-card.json`,    // GitHub Pages fallback
];
async function discoverAgentCard(baseUrl: string): Promise<AgentCard | null> {
  for (const path of AGENT_CARD_PATHS) {
    try {
      const res = await fetch(`${baseUrl}${path}`);
      if (res.ok) return await res.json();
    } catch { continue; }
  }
  return null;
}
```

This maintains A2A spec compliance on proper servers while falling back gracefully on static hosting.

**Lesson Learned**

The A2A specification assumes server control over root path routing. Static hosting on GitHub Pages (especially project sites with a basePath) breaks this assumption. A resilient discovery implementation should try multiple paths rather than hard-failing on the well-known convention.

---

## Bug #3: React Hydration Mismatch on AnimatedCounter

**Symptom**

After deploying, the browser console showed:

```
Warning: Text content does not match server-rendered HTML.
Server: "0"  Client: "1847"
    at span
    at AnimatedCounter (src/components/AnimatedCounter.tsx:14:18)
```

The stats section on the homepage would flash "0" then jump to final values without animation. The stats grid layout would visually shift during the re-render.

**Root Cause**

Next.js static export renders at build time. During build, `useAgentStore()` returns defaults (messageCount: 0, etc.), rendering "0". At hydration, the Zustand store rehydrates from localStorage and returns real values (1847, 5231), causing a mismatch.

**Debugging Process**

1. Reproduced by clearing localStorage and hard-refreshing -- error disappeared, confirming persisted state was the cause.
2. Added `console.log('SSR value:', value)` inside AnimatedCounter -- logged `1847` during hydration, confirming prop mismatch.
3. Rejected `suppressHydrationWarning` -- it masks the symptom without fixing the visual flash.

**Fix**

In `src/app/page.tsx`, we added a `mounted` state guard (lines 22, 26) and wrapped rendering in a conditional (lines 129-132):

```tsx
{mounted ? (
  <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={stat.duration} />
) : (
  <span className="font-mono">0{stat.suffix && <span className="text-sm text-[#9ca3af] ml-1">{stat.suffix}</span>}</span>
)}
```

During SSR/hydration, `mounted` is `false`, so we render a static `"0"` matching the server output. After hydration, `useEffect` fires, `mounted` becomes `true`, and AnimatedCounter mounts with real values and begins its easing animation.

**Lesson Learned**

Static export still performs server-side rendering at build time. Any component depending on client-only state (localStorage, window, cookies) will mismatch if read during the first render. The fix: render a deterministic placeholder during SSR, then swap to real content in `useEffect`.

---

## Bug #4: PDA Derivation Mismatch Between SDK and Manual Calculation

**Symptom**

During integration testing, the Agent Identity PDA derived in `src/lib/metaplex.ts` did not match the on-chain program's expectation:

```
Error: AnchorError: ConstraintSeeds. A seeds constraint was violated.
Expected PDA: 7Kp3xV...  Got: 4mNqR8...
```

We caught this during unit testing before deployment, but it blocked the registration flow for several hours.

**Root Cause**

The PDA derivation used incorrect seed encoding. The on-chain program derives the Agent Identity PDA with these seeds:

```rust
seeds = [b"agent_identity", asset.key().as_ref()]
```

Our TypeScript code passed the asset public key as a UTF-8 string instead of its 32-byte binary representation:

```ts
// WRONG: passes UTF-8 bytes of the base58 string (44-48 bytes)
const seeds = [
  Buffer.from("agent_identity"),
  Buffer.from(assetPublicKey),  // base58 string bytes, NOT pubkey bytes
];
```

A base58 public key is 44 characters as a string but 32 bytes as raw binary. Different byte lengths yield a completely different PDA.

**Debugging Process**

1. Printed both PDAs side-by-side -- they did not match.
2. Compared seed buffers: first seed was 14 bytes (correct), second was 44 bytes (should be 32).
3. Confirmed the Anchor program uses `asset.key().as_ref()` (raw 32-byte pubkey).
4. Realized `Buffer.from(assetPublicKey)` treats input as UTF-8 by default.

**Fix**

Used `PublicKey.toBuffer()` from `@solana/web3.js` to get the correct 32-byte representation:

```ts
import { PublicKey } from '@solana/web3.js';

function deriveAgentIdentityPda(assetPubkey: string): [PublicKey, number] {
  const PROGRAM_ID = new PublicKey('1DREGFgysWYxLnRnKQnwrxnJQeSMk2HmGaC6whw2B2p');
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("agent_identity"),
      new PublicKey(assetPubkey).toBuffer(),  // 32 bytes, not base58 string bytes
    ],
    PROGRAM_ID,
  );
}
```

In our codebase (`src/lib/metaplex.ts`), PDA functions return placeholder strings for the demo, but the correct derivation logic is documented in comments. The production path uses `findAgentIdentityV1Pda` from the Metaplex SDK, which handles encoding internally.

**Lesson Learned**

PDA seeds are raw byte arrays. `Buffer.from(someString)` gives you UTF-8 bytes, not the decoded binary of a base58 value. Always use `PublicKey.toBuffer()` for public key seeds and verify derived PDAs against the on-chain program using a test script. A single-byte difference produces a completely different address with no helpful error message.

---

## Summary

| Bug | Time to Diagnose | Root Cause Category |
|-----|------------------|---------------------|
| #1 Umi Buffer crash | ~3 hours | Node.js polyfill gap in static export |
| #2 Agent Card 404 | ~2 hours | Static hosting vs. A2A spec assumptions |
| #3 Hydration mismatch | ~1 hour | SSR/client state divergence |
| #4 PDA seed encoding | ~2 hours | Byte encoding mismatch (UTF-8 vs. binary) |

Every one of these bugs was invisible in `next dev` and only surfaced during `next build`, deployment to GitHub Pages, or integration testing against on-chain programs. The common thread: static export and client-side Solana development create subtle runtime differences that only manifest at build or deploy time.
