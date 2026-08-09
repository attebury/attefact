/**
 * docs/decisions/0001. `document`/`screen_recording` added -- tier 3
 * (self-hosted, weakest, matching the ADR), a genuinely new `upload`
 * binding: neither `pin` (git-specific) nor `snapshot` (fetch-a-URL)
 * fits a directly-uploaded file with no origin URL at all. See
 * attegrity's own ADR for the file-upload pass this landed in for the
 * full consumer-side design (a candidate-scoped R2 key, contentHash of
 * the uploaded bytes, archiveTier set synchronously since the upload
 * *is* the primary artifact, not a fallback). `package_release` (tier
 * 2) is the one remaining unwired kind from 0001's full taxonomy.
 */
export const EVIDENCE_KINDS = [
  "repo",
  "commit",
  "merged_pr",
  "deploy",
  "talk_external",
  "certification",
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
  document: "upload",
  screen_recording: "upload",
};

export function tierOfKind(kind: EvidenceKind): EvidenceTier {
  return TIER_BY_KIND[kind];
}

export function bindingOfKind(kind: EvidenceKind): BindingType {
  return BINDING_BY_KIND[kind];
}
