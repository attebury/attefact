/**
 * docs/decisions/0001. Starting set actually implemented -- the
 * broader taxonomy (certification, talk_external as tier 1;
 * package_release as tier 2; document, screen_recording as tier 3)
 * exists in the ADR but isn't wired up here yet.
 */
export const EVIDENCE_KINDS = ["repo", "commit", "merged_pr", "deploy", "talk_external"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export type EvidenceTier = 1 | 2 | 3;
export type EvidenceScope = "proves-claim" | "supports-skill";
export type BindingType = "pin" | "snapshot";

const TIER_BY_KIND: Record<EvidenceKind, EvidenceTier> = {
  merged_pr: 1,
  talk_external: 1,
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
};

export function tierOfKind(kind: EvidenceKind): EvidenceTier {
  return TIER_BY_KIND[kind];
}

export function bindingOfKind(kind: EvidenceKind): BindingType {
  return BINDING_BY_KIND[kind];
}
