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
export declare const evidenceStatus: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "evidence_status";
    schema: "attefact";
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "evidence_status";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        evidenceId: import("drizzle-orm/pg-core").PgColumn<{
            name: "evidence_id";
            tableName: "evidence_status";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "evidence_status";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lastCheckedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_checked_at";
            tableName: "evidence_status";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        consecutiveFailures: import("drizzle-orm/pg-core").PgColumn<{
            name: "consecutive_failures";
            tableName: "evidence_status";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        supersededBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "superseded_by";
            tableName: "evidence_status";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "evidence_status";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
