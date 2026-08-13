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

v0.2.0. Evidence kinds: `repo`/`commit`/`merged_pr`/`deploy`/
`talk_external`/`certification`/`package_release`/`document`/
`screen_recording` — the full 9-kind taxonomy is wired up. Three
bindings: `pin` (git-specific),
`snapshot` (fetch a URL, hash the response — `deploy`/`talk_external`/
`certification`/`package_release`), and `upload` (a directly-uploaded
file with no origin URL — `document`/`screen_recording`). The pin/snapshot capture
primitives, and the full rot-detection state machine
(`unverified`/`live`/`drifted`/`unreachable`/`archived`) with lazy
TTL-bounded re-verification — schema plus pure logic (`src/logic/`),
no DB client, no framework. The archive-fallback
*chain itself* (calling a third-party web archive, falling back to
self-hosted capture) is business logic left to consumers — this
package provides the schema columns (`archiveUrl`/`archiveTier`/
`archiveVerified`) and the state-machine branch that consumes their
result. Attestation, root-of-trust gating, and identity-proof
connectors are planned but not yet built.

### Database support

Schema is dialect-split, not dialect-agnostic — Drizzle has no unified
schema builder across databases, so each dialect gets its own
independently-authored module:

- `@attebury/attefact/schema/pg` — Postgres, tables live in a real
  `attefact` schema namespace (`src/schema/pg/`).
- `@attebury/attefact/schema/sqlite` — SQLite, tables carry an
  `attefact_` name prefix instead, since SQLite has no schema/namespace
  concept (`src/schema/sqlite/`).

Both modules define the same logical shape (columns, CHECK constraints,
relationships) and share one cross-dialect detail: every row's `id` is
generated app-side via `crypto.randomUUID()` (`src/logic/generate-id.ts`,
Drizzle's `$defaultFn()`), not a DB-native default — not every database
has one (SQLite has none at all).

Each dialect also has its own copy of the insert-only enforcement
trigger, since neither the SQL nor the underlying capability lines up
across engines — see `sql/enforce-insert-only.pg.sql` (PL/pgSQL,
combined `BEFORE UPDATE OR DELETE` triggers) versus
`sql/enforce-insert-only.sqlite.sql` (inline trigger bodies, no stored
functions, split into separate `BEFORE UPDATE`/`BEFORE DELETE`
triggers — SQLite has no combined form).

MySQL is not implemented, but the same per-dialect pattern extends to
it mechanically if a consumer needs it.

Both are proven against a real engine in CI, not just claimed: an
integration-test tier runs the actual shipped schema + trigger SQL
against Node's built-in `node:sqlite` (`src/schema/sqlite/integration.test.ts`)
and an embeddable WASM Postgres, `@electric-sql/pglite`
(`src/schema/pg/integration.test.ts`) — no external database server
required to run `npm test`.

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
what's planned but not yet built — found conflated into one
undifferentiated list in an adversarial
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
- The `evidence`/`evidence_status` schema those primitives run
  against, for both Postgres and SQLite (`src/schema/pg/`,
  `src/schema/sqlite/` — see [Database support](#database-support)),
  plus the DB-level triggers enforcing their insert-only contract
  (`sql/enforce-insert-only.pg.sql`, `sql/enforce-insert-only.sqlite.sql`).

**Not this package's job, by design** (schema/hooks provided, logic is
the consumer's):

- The archive-fallback capture chain itself (calling a third-party web
  archive, falling back to self-hosted capture) — which provider, which
  auth, which rate limits is application-specific. This package
  provides the schema columns (`archiveUrl`/`archiveTier`/
  `archiveVerified`) and the state-machine branch that consumes the
  result, not the fetch itself.

**Planned, not yet implemented:**

- A person-in-the-loop attestation request/response primitive, for claims
  that don't leave a public artifact trail.
- Root-of-trust gating logic for attestation and identity.
- Identity-proof connectors (linked accounts, KYC providers, workplace-
  domain proof).
- A reusable, append-only, immutable, revocable event-ledger primitive
  generalized beyond `evidence`/`evidence_status`'s own hand-written
  triggers.

## What it does not provide

Attefact ships general primitives only. Anything that requires
interpreting *what* a claim means, resolving conflicting claims against
each other, or building a trust graph across a specific network of people
is out of scope here and is left to applications built on top of Attefact.

## License

MIT — see [LICENSE](LICENSE).
