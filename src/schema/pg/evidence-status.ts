import { check, integer, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { attefact } from "./_namespace.js";
import { evidence } from "./evidence.js";
import { generateId } from "../../logic/generate-id.js";

/**
 * Insert-only, machine-written, kept separate from `evidence`'s
 * hand-authored content so a re-check can never mutate the original
 * evidence row -- every check is a NEW row, never an UPDATE of the
 * previous one. "Current" status for an evidence row is the latest
 * row here by `createdAt`.
 *
 * `lastCheckedAt` is nullable: null means genuinely never checked (the
 * `unverified` state), which TTL-due logic treats as always due.
 *
 * `consecutiveFailures` implements flap-debounce -- a single
 * failed check must not flip status. It has to live on this row (not
 * derived elsewhere) because each check is a new row, not an in-place
 * counter bump.
 *
 * `status`: "unverified" | "live" | "drifted" | "unreachable" |
 * "archived" -- kept in sync by hand with src/logic/state-machine.ts's
 * EvidenceStatusValue type. This comment previously listed only four of
 * the five values (missing "archived"), found out of sync with the
 * actual state machine in an adversarial review -- the CHECK constraint
 * below is a second guard against exactly this kind of drift, not just
 * this comment being corrected once.
 */
export const evidenceStatus = attefact.table(
  "evidence_status",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidence.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    supersededBy: uuid("superseded_by").references((): AnyPgColumn => evidenceStatus.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "evidence_status_valid",
      sql`${t.status} in ('unverified', 'live', 'drifted', 'unreachable', 'archived')`,
    ),
  ],
);
