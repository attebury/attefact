import { boolean, check, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { attefact } from "./_namespace.js";
import { generateId } from "../../logic/generate-id.js";

/**
 * Domain-agnostic on purpose -- no claim/accomplishment FK here;
 * consuming apps bind evidence to their own subjects in their own
 * tables, with a real FK back to this table's `id`.
 *
 * `pin` kinds (repo/commit/merged_pr) populate `pinRef` (an immutable
 * commit SHA/tag), never `contentHash`. `snapshot` kinds (deploy/
 * talk_external) populate `contentHash`, never `pinRef`. Exactly one
 * of the two is set, enforced below.
 *
 * `archiveUrl`/`archiveTier`/`archiveVerified`: an archive-fallback
 * chain (Wayback Machine, falling back to self-hosted).
 * `archiveVerified` is null until an archive attempt is
 * made (i.e. while `archiveTier` is still `"none"`), then true/false.
 * Both fields must stay visible rather than flattened into a single
 * "archived: true/false" -- a self-hosted fallback is weaker
 * corroboration than third-party archival.
 *
 * `supersededBy`: a drifted/rotted source gets a NEW evidence row,
 * never an overwrite of this one.
 *
 * `id` is generated app-side (`generateId()`, shared across every
 * dialect's schema module) rather than via a DB-native default -- not
 * every database has one (SQLite has none at all).
 */
export const evidence = attefact.table(
  "evidence",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    kind: text("kind").notNull(),
    scope: text("scope").notNull(), // "proves-claim" | "supports-skill"
    sourceUrl: text("source_url").notNull(),
    pinRef: text("pin_ref"),
    contentHash: text("content_hash"),
    archiveUrl: text("archive_url"),
    archiveTier: text("archive_tier").notNull().default("none"), // "none" | "third-party" | "self-hosted"
    archiveVerified: boolean("archive_verified"),
    supersededBy: uuid("superseded_by").references((): AnyPgColumn => evidence.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("evidence_binding_shape", sql`(${t.pinRef} is not null) <> (${t.contentHash} is not null)`),
    // Found missing in an adversarial review: `kind`/
    // `scope`/`archiveTier` were plain text with valid values documented
    // only in comments -- a bad insert (app bug, manual SQL, migration
    // mistake) could write an out-of-taxonomy value with nothing to
    // catch it. Kept in sync with src/logic/kind-taxonomy.ts's
    // EVIDENCE_KINDS by hand -- there's no single source both the
    // TypeScript type and this constraint can generate from without a
    // build step neither exists nor is worth adding at this size.
    check(
      "evidence_kind_valid",
      sql`${t.kind} in ('repo', 'commit', 'merged_pr', 'deploy', 'talk_external', 'certification', 'package_release', 'document', 'screen_recording')`,
    ),
    check("evidence_scope_valid", sql`${t.scope} in ('proves-claim', 'supports-skill')`),
    check("evidence_archive_tier_valid", sql`${t.archiveTier} in ('none', 'third-party', 'self-hosted')`),
  ],
);
