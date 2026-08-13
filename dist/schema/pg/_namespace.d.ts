/**
 * The `attefact` Postgres schema namespace. Every table this package
 * defines lives here, never in `public` -- consuming apps import these
 * table objects directly and run them against their own database, but
 * the namespace keeps Attefact-owned tables visibly distinct from the
 * consumer's own schema at the database level.
 */
export declare const attefact: import("drizzle-orm/pg-core").PgSchema<"attefact">;
