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

Design-stage. This repository currently contains scaffolding and design
documentation only — no implementation exists yet. See
[`docs/decisions/`](docs/decisions/) for the full design record.

## What it provides

- An evidence `kind` taxonomy, tiered by independence (third-party record,
  public self-published artifact, self-hosted document).
- Content-addressed `pin` and hash+archive `snapshot` primitives for
  binding a claim to immutable evidence.
- An archive-fallback capture chain for evidence sources that might go
  away.
- A rot-detection state machine that tracks whether evidence is still
  live, has drifted, has become unreachable, or is only reachable via
  archive.
- Lazy, TTL-bounded re-verification scheduling.
- A person-in-the-loop attestation request/response primitive, for claims
  that don't leave a public artifact trail.
- Root-of-trust gating logic for attestation and identity.
- Identity-proof connectors (linked accounts, KYC providers, workplace-
  domain proof).
- A reusable, append-only, immutable, revocable event-ledger primitive
  underlying all of the above.

## What it does not provide

Attefact ships general primitives only. Anything that requires
interpreting *what* a claim means, resolving conflicting claims against
each other, or building a trust graph across a specific network of people
is out of scope here and is left to applications built on top of Attefact.

## License

MIT — see [LICENSE](LICENSE).
