/**
 * docs/decisions/0001. Starting set actually implemented -- the
 * broader taxonomy (certification, talk_external as tier 1;
 * package_release as tier 2; document, screen_recording as tier 3)
 * exists in the ADR but isn't wired up here yet.
 */
export declare const EVIDENCE_KINDS: readonly ["repo", "commit", "merged_pr", "deploy", "talk_external"];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type EvidenceTier = 1 | 2 | 3;
export type EvidenceScope = "proves-claim" | "supports-skill";
export type BindingType = "pin" | "snapshot";
export declare function tierOfKind(kind: EvidenceKind): EvidenceTier;
export declare function bindingOfKind(kind: EvidenceKind): BindingType;
