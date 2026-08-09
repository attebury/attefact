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
export declare const EVIDENCE_KINDS: readonly ["repo", "commit", "merged_pr", "deploy", "talk_external", "certification", "document", "screen_recording"];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type EvidenceTier = 1 | 2 | 3;
export type EvidenceScope = "proves-claim" | "supports-skill";
export type BindingType = "pin" | "snapshot" | "upload";
export declare function tierOfKind(kind: EvidenceKind): EvidenceTier;
export declare function bindingOfKind(kind: EvidenceKind): BindingType;
