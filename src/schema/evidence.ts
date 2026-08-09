import { check, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
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
 * `archiveUrl`/`archiveTier`: docs/decisions/0003 (Wayback Machine +
 * self-hosted archive fallback capture) is deferred. Every row ships
 * `archiveTier: "none"`, `archiveUrl: null` for now -- this is where
 * 0003 plugs in later, at the same authoring-time capture point as
 * `contentHash` below. Nothing else about this table changes when it
 * does.
 *
 * `supersededBy`: per 0002, a drifted/rotted source gets a NEW
 * evidence row, never an overwrite of this one.
 */
export const evidence = attefact.table(
  "evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    scope: text("scope").notNull(), // "proves-claim" | "supports-skill"
    sourceUrl: text("source_url").notNull(),
    pinRef: text("pin_ref"),
    contentHash: text("content_hash"),
    archiveUrl: text("archive_url"),
    archiveTier: text("archive_tier").notNull().default("none"), // "none" | "third-party" | "self-hosted"
    supersededBy: uuid("superseded_by").references((): AnyPgColumn => evidence.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("evidence_binding_shape", sql`(${t.pinRef} is not null) <> (${t.contentHash} is not null)`),
  ],
);
