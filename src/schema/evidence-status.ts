import { integer, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { attefact } from "./_namespace";
import { evidence } from "./evidence";

/**
 * docs/decisions/0004, 0005. Insert-only, machine-written, kept
 * separate from `evidence`'s hand-authored content so a re-check can
 * never mutate the original evidence row -- every check is a NEW row,
 * never an UPDATE of the previous one. "Current" status for an
 * evidence row is the latest row here by `createdAt`.
 *
 * `lastCheckedAt` is nullable: null means genuinely never checked (the
 * `unverified` state), which TTL-due logic treats as always due.
 *
 * `consecutiveFailures` implements 0005's flap-debounce -- a single
 * failed check must not flip status. It has to live on this row (not
 * derived elsewhere) because each check is a new row, not an in-place
 * counter bump.
 */
export const evidenceStatus = attefact.table("evidence_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  evidenceId: uuid("evidence_id")
    .notNull()
    .references(() => evidence.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // "unverified" | "live" | "drifted" | "unreachable"
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  supersededBy: uuid("superseded_by").references((): AnyPgColumn => evidenceStatus.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
