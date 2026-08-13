/**
 * docs/decisions/0001. `package_release` added -- tier 2 ("public, but
 * self-published," grouped with repo/commit/deploy), snapshot-bound:
 * a package registry's release page or artifact URL is hashed and
 * archived exactly like a `deploy`/`certification` source, no new
 * binding or schema needed. This completes 0001's full 9-kind
 * taxonomy -- every kind the ADR named is now wired up.
 *
 * `document`/`screen_recording` (tier 3, self-hosted, weakest) use a
 * genuinely new `upload` binding: neither `pin` (git-specific) nor
 * `snapshot` (fetch-a-URL) fits a directly-uploaded file with no
 * origin URL at all. The consumer-side design (an owner-scoped storage
 * key, contentHash of the uploaded bytes, archiveTier set synchronously
 * since the upload *is* the primary artifact, not a fallback) lives in
 * whichever application integrates this binding -- attefact only
 * defines the taxonomy, not how a consumer stores the file.
 */
export const EVIDENCE_KINDS = [
  "repo",
  "commit",
  "merged_pr",
  "deploy",
  "talk_external",
  "certification",
  "package_release",
  "document",
  "screen_recording",
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export type EvidenceTier = 1 | 2 | 3;
export type EvidenceScope = "proves-claim" | "supports-skill";
export type BindingType = "pin" | "snapshot" | "upload";

const TIER_BY_KIND: Record<EvidenceKind, EvidenceTier> = {
  merged_pr: 1,
  talk_external: 1,
  certification: 1,
  repo: 2,
  commit: 2,
  deploy: 2,
  package_release: 2,
  document: 3,
  screen_recording: 3,
};

const BINDING_BY_KIND: Record<EvidenceKind, BindingType> = {
  repo: "pin",
  commit: "pin",
  merged_pr: "pin",
  deploy: "snapshot",
  talk_external: "snapshot",
  certification: "snapshot",
  package_release: "snapshot",
  document: "upload",
  screen_recording: "upload",
};

export function tierOfKind(kind: EvidenceKind): EvidenceTier {
  return TIER_BY_KIND[kind];
}

export function bindingOfKind(kind: EvidenceKind): BindingType {
  return BINDING_BY_KIND[kind];
}
