# Attefact

Attefact is a standalone, domain-agnostic evidence and verification engine.
It answers one narrow question well: given a claim, how do you attach
independently-checkable evidence to it, keep that evidence honest over
time, and let a real person vouch for the parts no public artifact can
prove?

Attefact is not tied to any particular application domain — nothing about
pinning a claim's evidence and detecting when it rots is specific to any
one use case. It provides the primitives; binding evidence to a specific
kind of claim (what the claim is *about*) is left to the application built
on top of it.

## Status

v0.1.6. Evidence kinds: `repo`/`commit`/`merged_pr`/`deploy`/
`talk_external`/`certification`/`package_release`/`document`/
`screen_recording` — every kind [0001](docs/decisions/0001-evidence-kind-taxonomy.md)
named is now wired up. Three bindings: `pin` (git-specific),
`snapshot` (fetch a URL, hash the response — `deploy`/`talk_external`/
`certification`/`package_release`), and `upload` (a directly-uploaded
file with no origin URL — `document`/`screen_recording`). The pin/snapshot capture
primitives, and the full rot-detection state machine
(`unverified`/`live`/`drifted`/`unreachable`/`archived`) with lazy
TTL-bounded re-verification — schema (`src/schema/`) plus pure logic
(`src/logic/`), no DB client, no framework. The archive-fallback
*chain itself* (calling a third-party web archive, falling back to
self-hosted capture) is business logic left to consumers per 0010 —
this package provides the schema columns (`archiveUrl`/`archiveTier`/
`archiveVerified`) and the state-machine branch that consumes their
result. Attestation, root-of-trust gating, and identity-proof
connectors are designed (see [`docs/decisions/`](docs/decisions/)) but
not yet built.

**`dist/` is committed on purpose**, not just gitignored build output.
This package is installed by consumers as a git dependency (no npm
registry), and Node refuses to type-strip `.ts` files that live under
`node_modules` — a deliberate Node safety boundary, not a bug to route
around with a flag. Shipping only `src/` broke `drizzle-kit generate`
in the first consumer the moment it tried to load this package's
schema. `src/` stays the source of truth; run `npm run build` and
commit the result before tagging a release.

## What it provides

Split below into what's actually implemented in `src/` today versus
what's designed (see [`docs/decisions/`](docs/decisions/)) but not yet
built — found conflated into one undifferentiated list in an adversarial
review, which for a trust/verification library is a dangerous thing to
get wrong: a reader skimming the old list could reasonably believe
security-critical gating was implemented when it wasn't.

**Built:**

- An evidence `kind` taxonomy, tiered by independence (third-party record,
  public self-published artifact, self-hosted document) — `src/logic/kind-taxonomy.ts`.
- Content-addressed `pin` parsing for binding a claim to immutable
  evidence — `src/logic/pin-parse.ts`. Parsing only, no network I/O;
  the actual fetch is a consumer's job (see below).
- A rot-detection state machine that tracks whether evidence is still
  live, has drifted, has become unreachable, or is only reachable via
  archive, plus lazy TTL-bounded re-verification scheduling —
  `src/logic/state-machine.ts`, `src/logic/ttl.ts`.
- The `evidence`/`evidence_status` schema (`src/schema/`) those
  primitives run against.

**Not this package's job, by design** (schema/hooks provided, logic is
the consumer's):

- The archive-fallback capture chain itself (calling a third-party web
  archive, falling back to self-hosted capture) — which provider, which
  auth, which rate limits is application-specific (0010). This package
  provides the schema columns (`archiveUrl`/`archiveTier`/
  `archiveVerified`) and the state-machine branch that consumes the
  result, not the fetch itself.

**Designed, not yet implemented** — real ADRs exist, no code does yet:

- A person-in-the-loop attestation request/response primitive, for claims
  that don't leave a public artifact trail.
- Root-of-trust gating logic for attestation and identity.
- Identity-proof connectors (linked accounts, KYC providers, workplace-
  domain proof).
- A reusable, append-only, immutable, revocable event-ledger primitive.
  (Today, the insert-only contract on `evidence`/`evidence_status` is
  comments-only — no database-level enforcement exists yet either.)

## What it does not provide

Attefact ships general primitives only. Anything that requires
interpreting *what* a claim means, resolving conflicting claims against
each other, or building a trust graph across a specific network of people
is out of scope here and is left to applications built on top of Attefact.

## License

MIT — see [LICENSE](LICENSE).
