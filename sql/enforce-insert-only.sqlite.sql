-- SQLite enforcement for evidence/evidence_status's insert-only
-- contract -- the same guarantee as enforce-insert-only.pg.sql, in
-- SQLite's own trigger syntax. Two real differences from the Postgres
-- version, not just a syntax port:
--
-- - SQLite triggers fire on exactly one event each (no "BEFORE UPDATE
--   OR DELETE" combined form), so each Postgres trigger becomes two
--   SQLite triggers here.
-- - SQLite has no stored functions -- the trigger body is inline SQL,
--   no separate CREATE FUNCTION step.
--
-- Postgres's `IS DISTINCT FROM` (a NULL-safe "not equal") has a direct
-- SQLite equivalent: `IS NOT`. SQLite's `IS`/`IS NOT` are already
-- NULL-safe by definition, so the WHEN clauses below read the same as
-- the Postgres version's IF conditions, column for column.
--
-- Table names carry the `attefact_` prefix here (no schema/namespace
-- concept in SQLite) -- see src/schema/sqlite/evidence.ts.

CREATE TRIGGER attefact_evidence_status_prevent_update
  BEFORE UPDATE ON attefact_evidence_status
BEGIN
  SELECT RAISE(ABORT, 'attefact_evidence_status is insert-only; UPDATE is not allowed');
END;

CREATE TRIGGER attefact_evidence_status_prevent_delete
  BEFORE DELETE ON attefact_evidence_status
BEGIN
  SELECT RAISE(ABORT, 'attefact_evidence_status is insert-only; DELETE is not allowed');
END;

-- evidence has exactly one deliberate exception (a real, narrow one,
-- not a loophole): a consumer's archive-fallback capture task writes
-- archive_url/archive_tier/archive_verified once, at authoring time,
-- when the async archive attempt finishes. Every other column (id,
-- kind, scope, source_url, pin_ref, content_hash, superseded_by,
-- created_at) is the hand-authored, tamper-evident content this table
-- exists to protect, and DELETE is never valid at all -- a drifted or
-- rotted source gets a new row referencing this one via superseded_by,
-- never an overwrite.

CREATE TRIGGER attefact_evidence_prevent_delete
  BEFORE DELETE ON attefact_evidence
BEGIN
  SELECT RAISE(ABORT, 'attefact_evidence rows are never deleted -- a drifted/rotted source gets a new row (superseded_by)');
END;

CREATE TRIGGER attefact_evidence_prevent_mutation
  BEFORE UPDATE ON attefact_evidence
  WHEN NEW.id IS NOT OLD.id
    OR NEW.kind IS NOT OLD.kind
    OR NEW.scope IS NOT OLD.scope
    OR NEW.source_url IS NOT OLD.source_url
    OR NEW.pin_ref IS NOT OLD.pin_ref
    OR NEW.content_hash IS NOT OLD.content_hash
    OR NEW.superseded_by IS NOT OLD.superseded_by
    OR NEW.created_at IS NOT OLD.created_at
BEGIN
  SELECT RAISE(ABORT, 'attefact_evidence only allows updating archive_url/archive_tier/archive_verified -- every other column is immutable once inserted');
END;
