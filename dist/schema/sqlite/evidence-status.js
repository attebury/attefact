import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { evidence } from "./evidence.js";
import { generateId } from "../../logic/generate-id.js";
/**
 * SQLite counterpart to `../pg/evidence-status.ts` -- see that file
 * for the full rationale, not repeated here. Same two differences as
 * `./evidence.ts`: `attefact_` table-name prefix instead of a schema
 * namespace, `text` ids instead of a native `uuid` type.
 */
export const evidenceStatus = sqliteTable("attefact_evidence_status", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => generateId()),
    evidenceId: text("evidence_id")
        .notNull()
        .references(() => evidence.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    supersededBy: text("superseded_by").references(() => evidenceStatus.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql `(unixepoch())`),
}, (t) => [
    check("evidence_status_valid", sql `${t.status} in ('unverified', 'live', 'drifted', 'unreachable', 'archived')`),
]);
