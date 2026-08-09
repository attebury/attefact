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
export declare const EVIDENCE_KINDS: readonly ["repo", "commit", "merged_pr", "deploy", "talk_external", "certification"];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type EvidenceTier = 1 | 2 | 3;
export type EvidenceScope = "proves-claim" | "supports-skill";
export type BindingType = "pin" | "snapshot";
export declare function tierOfKind(kind: EvidenceKind): EvidenceTier;
export declare function bindingOfKind(kind: EvidenceKind): BindingType;
