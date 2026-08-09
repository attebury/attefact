/**
 * docs/decisions/0001. `certification` added (0029-ish -- see
 * attegrity's own ADR for the non-dev-professions pass this landed
 * in): a third-party-issued credential, tier 1 like merged_pr/
 * talk_external, snapshot-bound like deploy/talk_external -- a
 * verification/lookup URL is hashed and archived exactly like any
 * other snapshot, no new binding type or schema needed. The rest of
 * the broader taxonomy (package_release as tier 2; document,
 * screen_recording as tier 3 -- these need a real file-upload
 * mechanism, not a URL to fetch) still isn't wired up here.
 */
export const EVIDENCE_KINDS = [
  "repo",
  "commit",
  "merged_pr",
  "deploy",
  "talk_external",
  "certification",
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export type EvidenceTier = 1 | 2 | 3;
export type EvidenceScope = "proves-claim" | "supports-skill";
export type BindingType = "pin" | "snapshot";

const TIER_BY_KIND: Record<EvidenceKind, EvidenceTier> = {
  merged_pr: 1,
  talk_external: 1,
  certification: 1,
  repo: 2,
  commit: 2,
  deploy: 2,
};

const BINDING_BY_KIND: Record<EvidenceKind, BindingType> = {
  repo: "pin",
  commit: "pin",
  merged_pr: "pin",
  deploy: "snapshot",
  talk_external: "snapshot",
  certification: "snapshot",
};

export function tierOfKind(kind: EvidenceKind): EvidenceTier {
  return TIER_BY_KIND[kind];
}

export function bindingOfKind(kind: EvidenceKind): BindingType {
  return BINDING_BY_KIND[kind];
}
