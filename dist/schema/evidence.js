import { boolean, check, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { attefact } from "./_namespace.js";
/**
 * docs/decisions/0001, 0002. Domain-agnostic on purpose (0010) -- no
 * claim/accomplishment FK here; consuming apps bind evidence to their
 * own subjects in their own tables, with a real FK back to this
 * table's `id`.
 *
 * `pin` kinds (repo/commit/merged_pr) populate `pinRef` (an immutable
 * commit SHA/tag), never `contentHash`. `snapshot` kinds (deploy/
 * talk_external) populate `contentHash`, never `pinRef`. Exactly one
 * of the two is set, enforced below.
 *
 * `archiveUrl`/`archiveTier`/`archiveVerified`: docs/decisions/0003's
 * archive-fallback chain (Wayback Machine, falling back to
 * self-hosted). `archiveVerified` is null until an archive attempt is
 * made (i.e. while `archiveTier` is still `"none"`), then true/false.
 * Both fields must stay visible rather than flattened into a single
 * "archived: true/false" -- a self-hosted fallback is weaker
 * corroboration than third-party archival per 0003's own wording.
 *
 * `supersededBy`: per 0002, a drifted/rotted source gets a NEW
 * evidence row, never an overwrite of this one.
 */
export const evidence = attefact.table("evidence", {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    scope: text("scope").notNull(), // "proves-claim" | "supports-skill"
    sourceUrl: text("source_url").notNull(),
    pinRef: text("pin_ref"),
    contentHash: text("content_hash"),
    archiveUrl: text("archive_url"),
    archiveTier: text("archive_tier").notNull().default("none"), // "none" | "third-party" | "self-hosted"
    archiveVerified: boolean("archive_verified"),
    supersededBy: uuid("superseded_by").references(() => evidence.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    check("evidence_binding_shape", sql `(${t.pinRef} is not null) <> (${t.contentHash} is not null)`),
]);
