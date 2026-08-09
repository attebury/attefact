import { pgSchema } from "drizzle-orm/pg-core";
/**
 * The `attefact` Postgres schema namespace. Every table this package
 * defines lives here, never in `public` -- consuming apps import these
 * table objects directly and run them against their own database
 * (docs/decisions/0010, 0014 in the consuming app's own decision
 * record), but the namespace keeps Attefact-owned tables visibly
 * distinct from the consumer's own schema at the database level.
 */
export const attefact = pgSchema("attefact");
