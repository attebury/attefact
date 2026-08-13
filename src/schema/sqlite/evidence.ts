import { check, integer, sqliteTable, text, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { generateId } from "../../logic/generate-id.js";

/**
 * SQLite counterpart to `../pg/evidence.ts` -- same columns, same
 * semantics, same CHECK constraints. Two real differences from the
 * Postgres version:
 *
 * - No `attefact` schema namespace: SQLite has no sub-database
 *   namespacing concept, so the table name itself carries the
 *   `attefact_` prefix instead, to keep this package's tables visibly
 *   distinct from a consumer's own.
 * - `id`/`supersededBy` are `text`, not a native `uuid` type -- SQLite
 *   has no UUID type at all. Both still hold the same app-generated
 *   UUID string from `generateId()`.
 *
 * See `../pg/evidence.ts` for the full column-by-column rationale;
 * not repeated here to avoid the two files drifting out of sync in
 * their comments while staying in sync in their columns.
 */
export const evidence = sqliteTable(
  "attefact_evidence",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    kind: text("kind").notNull(),
    scope: text("scope").notNull(), // "proves-claim" | "supports-skill"
    sourceUrl: text("source_url").notNull(),
    pinRef: text("pin_ref"),
    contentHash: text("content_hash"),
    archiveUrl: text("archive_url"),
    archiveTier: text("archive_tier").notNull().default("none"), // "none" | "third-party" | "self-hosted"
    archiveVerified: integer("archive_verified", { mode: "boolean" }),
    supersededBy: text("superseded_by").references((): AnySQLiteColumn => evidence.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [
    check("evidence_binding_shape", sql`(${t.pinRef} is not null) <> (${t.contentHash} is not null)`),
    check(
      "evidence_kind_valid",
      sql`${t.kind} in ('repo', 'commit', 'merged_pr', 'deploy', 'talk_external', 'certification', 'package_release', 'document', 'screen_recording')`,
    ),
    check("evidence_scope_valid", sql`${t.scope} in ('proves-claim', 'supports-skill')`),
    check("evidence_archive_tier_valid", sql`${t.archiveTier} in ('none', 'third-party', 'self-hosted')`),
  ],
);
