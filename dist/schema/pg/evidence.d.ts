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
export declare const evidence: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "evidence";
    schema: "attefact";
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "evidence";
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
        kind: import("drizzle-orm/pg-core").PgColumn<{
            name: "kind";
            tableName: "evidence";
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
        scope: import("drizzle-orm/pg-core").PgColumn<{
            name: "scope";
            tableName: "evidence";
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
        sourceUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_url";
            tableName: "evidence";
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
        pinRef: import("drizzle-orm/pg-core").PgColumn<{
            name: "pin_ref";
            tableName: "evidence";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        contentHash: import("drizzle-orm/pg-core").PgColumn<{
            name: "content_hash";
            tableName: "evidence";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        archiveUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "archive_url";
            tableName: "evidence";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        archiveTier: import("drizzle-orm/pg-core").PgColumn<{
            name: "archive_tier";
            tableName: "evidence";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        archiveVerified: import("drizzle-orm/pg-core").PgColumn<{
            name: "archive_verified";
            tableName: "evidence";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
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
        supersededBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "superseded_by";
            tableName: "evidence";
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
            tableName: "evidence";
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
