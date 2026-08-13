-- Postgres enforcement for evidence/evidence_status's insert-only
-- contract -- found missing in an adversarial review: the "nothing is
-- ever mutated" guarantee was comments-only in the schema files, with
-- nothing stopping a raw UPDATE/DELETE from breaking the tamper-evidence
-- property the whole design depends on. See enforce-insert-only.sqlite.sql
-- for the same guarantee against SQLite's own trigger syntax.
--
-- Attefact ships schema definitions only (src/schema/), no migration
-- tooling of its own -- this repo has no migrations/ directory, and a
-- consuming application's own drizzle-kit (or equivalent) generates and
-- applies the actual migration against the one real database that uses
-- these tables. This file is the canonical copy of that enforcement SQL;
-- apply it as a custom migration alongside whichever migration first
-- creates the `evidence`/`evidence_status` tables.

-- evidence_status is fully insert-only, no exceptions -- every re-check
-- is a new row, never an update of the previous one (per its own
-- schema file's doc comment).
CREATE OR REPLACE FUNCTION attefact.evidence_status_prevent_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'attefact.evidence_status is insert-only; % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evidence_status_prevent_mutation
  BEFORE UPDATE OR DELETE ON attefact.evidence_status
  FOR EACH ROW EXECUTE FUNCTION attefact.evidence_status_prevent_mutation();

-- evidence has exactly one deliberate exception (a real, narrow one, not
-- a loophole): a consumer's archive-fallback capture task writes
-- archive_url/archive_tier/archive_verified once, at authoring time,
-- when the async archive attempt finishes. Every other column
-- (kind, scope, source_url, pin_ref, content_hash, superseded_by,
-- created_at) is the hand-authored, tamper-evident content this table
-- exists to protect, and DELETE is never valid at all -- a drifted or
-- rotted source gets a new row referencing this one via superseded_by,
-- never an overwrite.
CREATE OR REPLACE FUNCTION attefact.evidence_prevent_mutation() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'attefact.evidence rows are never deleted -- a drifted/rotted source gets a new row (superseded_by)';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.kind IS DISTINCT FROM OLD.kind
    OR NEW.scope IS DISTINCT FROM OLD.scope
    OR NEW.source_url IS DISTINCT FROM OLD.source_url
    OR NEW.pin_ref IS DISTINCT FROM OLD.pin_ref
    OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
    OR NEW.superseded_by IS DISTINCT FROM OLD.superseded_by
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'attefact.evidence only allows updating archive_url/archive_tier/archive_verified -- every other column is immutable once inserted';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evidence_prevent_mutation
  BEFORE UPDATE OR DELETE ON attefact.evidence
  FOR EACH ROW EXECUTE FUNCTION attefact.evidence_prevent_mutation();
