import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { evidence } from "./evidence.js";
import { evidenceStatus } from "./evidence-status.js";

const TRIGGER_SQL = readFileSync(
  fileURLToPath(new URL("../../../sql/enforce-insert-only.pg.sql", import.meta.url)),
  "utf8",
);

/**
 * Attefact ships schema definitions only, no migration tooling (see
 * README) -- this DDL hand-mirrors src/schema/pg/{evidence,evidence-status}.ts
 * the same way a consumer's own drizzle-kit output would. Kept in sync
 * by hand, same tradeoff as src/logic/kind-taxonomy.ts's CHECK-constraint
 * comment.
 */
const SCHEMA_DDL = `
  CREATE SCHEMA attefact;

  CREATE TABLE attefact.evidence (
    id uuid PRIMARY KEY,
    kind text NOT NULL CHECK (kind in ('repo', 'commit', 'merged_pr', 'deploy', 'talk_external', 'certification', 'package_release', 'document', 'screen_recording')),
    scope text NOT NULL CHECK (scope in ('proves-claim', 'supports-skill')),
    source_url text NOT NULL,
    pin_ref text,
    content_hash text,
    archive_url text,
    archive_tier text NOT NULL DEFAULT 'none' CHECK (archive_tier in ('none', 'third-party', 'self-hosted')),
    archive_verified boolean,
    superseded_by uuid REFERENCES attefact.evidence(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK ((pin_ref is not null) <> (content_hash is not null))
  );

  CREATE TABLE attefact.evidence_status (
    id uuid PRIMARY KEY,
    evidence_id uuid NOT NULL REFERENCES attefact.evidence(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status in ('unverified', 'live', 'drifted', 'unreachable', 'archived')),
    last_checked_at timestamptz,
    consecutive_failures integer NOT NULL DEFAULT 0,
    superseded_by uuid REFERENCES attefact.evidence_status(id),
    created_at timestamptz NOT NULL DEFAULT now()
  );
`;

/**
 * node-postgres-style drivers wrap the underlying Postgres error in a
 * DrizzleQueryError -- the RAISE EXCEPTION text lands on
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

let client: PGlite | undefined;

async function setupDb() {
  client = new PGlite();
  await client.exec(SCHEMA_DDL);
  await client.exec(TRIGGER_SQL);
  return drizzle(client);
}

afterEach(async () => {
  await client?.close();
  client = undefined;
});

describe("postgres schema + trigger integration (pglite)", () => {
  it("inserts evidence through the actual Drizzle schema objects", async () => {
    const db = await setupDb();
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
    const db = await setupDb();
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
    const db = await setupDb();
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
    const db = await setupDb();
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
    const db = await setupDb();
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
    const db = await setupDb();
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
    const db = await setupDb();
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
