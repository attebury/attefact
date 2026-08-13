import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { describe, expect, it } from "vitest";
import { evidence } from "./evidence.js";
import { evidenceStatus } from "./evidence-status.js";

/**
 * Bridges Drizzle's sqlite-proxy driver to Node's built-in `node:sqlite`,
 * test-only infrastructure (not shipped in dist -- excluded from the
 * build the same way as this file, via tsconfig.build.json's
 * `*.test.ts` exclude). No dedicated `drizzle-orm/node-sqlite` driver
 * exists in the installed drizzle-orm version, and sqlite-proxy's
 * callback shape is the documented way to point Drizzle at any
 * SQLite-like backend -- `setReturnArrays(true)` is required because
 * sqlite-proxy decodes rows positionally (`row[columnIndex]`), not by
 * column name, which is also why the callback can't just forward
 * `node:sqlite`'s default object-shaped rows.
 */
function drizzleNodeSqlite(db: DatabaseSync) {
  return drizzle(async (sql, params, method) => {
    const stmt = db.prepare(sql);
    if (method === "run") {
      stmt.run(...params);
      return { rows: [] };
    }
    stmt.setReturnArrays(true);
    // node:sqlite's types don't reflect setReturnArrays(true) -- it
    // still declares `all()` as returning row objects, but the actual
    // runtime shape switches to positional arrays.
    const rows = stmt.all(...params) as unknown as unknown[][];
    return { rows };
  });
}

/**
 * sqlite-proxy wraps the underlying node:sqlite exception in a
 * DrizzleQueryError -- the RAISE(ABORT, 'message') text lands on
 * `.cause.message`, not the top-level `.message` (which is just
 * "Failed query: ...").
 */
async function rejectsWithCause(thunk: () => Promise<unknown>, pattern: RegExp) {
  let caught: unknown;
  try {
    await thunk();
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(Error);
  expect((caught as Error & { cause?: Error }).cause?.message).toMatch(pattern);
}

const TRIGGER_SQL = readFileSync(
  fileURLToPath(new URL("../../../sql/enforce-insert-only.sqlite.sql", import.meta.url)),
  "utf8",
);

/**
 * Attefact ships schema definitions only, no migration tooling (see
 * README) -- this DDL hand-mirrors src/schema/sqlite/{evidence,evidence-status}.ts
 * the same way a consumer's own drizzle-kit output would. Kept in sync
 * by hand, same tradeoff as src/logic/kind-taxonomy.ts's CHECK-constraint
 * comment.
 */
const SCHEMA_DDL = `
  CREATE TABLE attefact_evidence (
    id text PRIMARY KEY,
    kind text NOT NULL CHECK (kind in ('repo', 'commit', 'merged_pr', 'deploy', 'talk_external', 'certification', 'package_release', 'document', 'screen_recording')),
    scope text NOT NULL CHECK (scope in ('proves-claim', 'supports-skill')),
    source_url text NOT NULL,
    pin_ref text,
    content_hash text,
    archive_url text,
    archive_tier text NOT NULL DEFAULT 'none' CHECK (archive_tier in ('none', 'third-party', 'self-hosted')),
    archive_verified integer,
    superseded_by text REFERENCES attefact_evidence(id),
    created_at integer NOT NULL DEFAULT (unixepoch()),
    CHECK ((pin_ref is not null) <> (content_hash is not null))
  );

  CREATE TABLE attefact_evidence_status (
    id text PRIMARY KEY,
    evidence_id text NOT NULL REFERENCES attefact_evidence(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status in ('unverified', 'live', 'drifted', 'unreachable', 'archived')),
    last_checked_at integer,
    consecutive_failures integer NOT NULL DEFAULT 0,
    superseded_by text REFERENCES attefact_evidence_status(id),
    created_at integer NOT NULL DEFAULT (unixepoch())
  );
`;

function setupDb() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(SCHEMA_DDL);
  sqlite.exec(TRIGGER_SQL);
  return drizzleNodeSqlite(sqlite);
}

describe("sqlite schema + trigger integration (node:sqlite)", () => {
  it("inserts evidence through the actual Drizzle schema objects", async () => {
    const db = setupDb();
    const [row] = await db
      .insert(evidence)
      .values({
        kind: "repo",
        scope: "proves-claim",
        sourceUrl: "https://example.com/repo",
        pinRef: "abc123",
      })
      .returning();

    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row.archiveTier).toBe("none");
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it("rejects an out-of-taxonomy kind via the CHECK constraint", async () => {
    const db = setupDb();
    await expect(
      db.insert(evidence).values({
        kind: "not-a-real-kind",
        scope: "proves-claim",
        sourceUrl: "https://example.com/repo",
        pinRef: "abc123",
      }),
    ).rejects.toThrow();
  });

  it("rejects setting both pinRef and contentHash via the binding-shape CHECK", async () => {
    const db = setupDb();
    await expect(
      db.insert(evidence).values({
        kind: "repo",
        scope: "proves-claim",
        sourceUrl: "https://example.com/repo",
        pinRef: "abc123",
        contentHash: "deadbeef",
      }),
    ).rejects.toThrow();
  });

  it("blocks UPDATE of an immutable evidence column via the trigger", async () => {
    const db = setupDb();
    const [row] = await db
      .insert(evidence)
      .values({
        kind: "repo",
        scope: "proves-claim",
        sourceUrl: "https://example.com/repo",
        pinRef: "abc123",
      })
      .returning();

    await rejectsWithCause(
      () => db.update(evidence).set({ sourceUrl: "https://example.com/tampered" }).where(eq(evidence.id, row.id)),
      /immutable/,
    );
  });

  it("allows the one deliberate archive-field UPDATE exception", async () => {
    const db = setupDb();
    const [row] = await db
      .insert(evidence)
      .values({
        kind: "repo",
        scope: "proves-claim",
        sourceUrl: "https://example.com/repo",
        pinRef: "abc123",
      })
      .returning();

    await db
      .update(evidence)
      .set({ archiveTier: "third-party", archiveVerified: true })
      .where(eq(evidence.id, row.id));
    const [after] = await db.select().from(evidence).where(eq(evidence.id, row.id));
    expect(after.archiveTier).toBe("third-party");
    expect(after.archiveVerified).toBe(true);
  });

  it("blocks DELETE of an evidence row via the trigger", async () => {
    const db = setupDb();
    const [row] = await db
      .insert(evidence)
      .values({
        kind: "repo",
        scope: "proves-claim",
        sourceUrl: "https://example.com/repo",
        pinRef: "abc123",
      })
      .returning();

    await rejectsWithCause(() => db.delete(evidence).where(eq(evidence.id, row.id)), /never deleted/);
  });

  it("blocks UPDATE and DELETE of evidence_status rows via its insert-only triggers", async () => {
    const db = setupDb();
    const [ev] = await db
      .insert(evidence)
      .values({
        kind: "repo",
        scope: "proves-claim",
        sourceUrl: "https://example.com/repo",
        pinRef: "abc123",
      })
      .returning();
    const [status] = await db
      .insert(evidenceStatus)
      .values({ evidenceId: ev.id, status: "unverified" })
      .returning();

    await rejectsWithCause(
      () => db.update(evidenceStatus).set({ status: "live" }).where(eq(evidenceStatus.id, status.id)),
      /insert-only/,
    );
    await rejectsWithCause(
      () => db.delete(evidenceStatus).where(eq(evidenceStatus.id, status.id)),
      /insert-only/,
    );
  });
});
