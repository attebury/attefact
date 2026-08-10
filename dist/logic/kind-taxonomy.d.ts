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
 * origin URL at all. See attegrity's own ADR for the file-upload pass
 * this landed in for the full consumer-side design (a candidate-scoped
 * R2 key, contentHash of the uploaded bytes, archiveTier set
 * synchronously since the upload *is* the primary artifact, not a
 * fallback).
 */
export declare const EVIDENCE_KINDS: readonly ["repo", "commit", "merged_pr", "deploy", "talk_external", "certification", "package_release", "document", "screen_recording"];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type EvidenceTier = 1 | 2 | 3;
export type EvidenceScope = "proves-claim" | "supports-skill";
export type BindingType = "pin" | "snapshot" | "upload";
export declare function tierOfKind(kind: EvidenceKind): EvidenceTier;
export declare function bindingOfKind(kind: EvidenceKind): BindingType;
