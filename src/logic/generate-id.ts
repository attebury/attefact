/**
 * App-side primary-key generation, shared by every dialect's schema
 * module. Not every database has a native UUID generator (SQLite has
 * none at all; MySQL's differs from Postgres's) -- generating the id
 * here, once, in portable TypeScript, means the schema tables
 * themselves never depend on a dialect-specific default-generation
 * function. Uses the standard Web Crypto API (`crypto.randomUUID()`),
 * available in Node, browsers, and edge runtimes alike -- not
 * `node:crypto`, which would tie this back to one runtime.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
