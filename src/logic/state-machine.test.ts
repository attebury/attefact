import { describe, expect, it } from "vitest";
import { nextEvidenceStatus, type CheckResult } from "./state-machine.js";

const now = new Date("2026-08-09T12:00:00Z");

const unreachable: CheckResult = { reachable: false, contentMatches: null, archiveReachable: null };
const unreachableWithArchive: CheckResult = { reachable: false, contentMatches: null, archiveReachable: true };
const unreachableArchiveDown: CheckResult = { reachable: false, contentMatches: null, archiveReachable: false };
const liveMatch: CheckResult = { reachable: true, contentMatches: true, archiveReachable: null };
const liveMismatch: CheckResult = { reachable: true, contentMatches: false, archiveReachable: null };
const liveNoComparison: CheckResult = { reachable: true, contentMatches: null, archiveReachable: null };

describe("nextEvidenceStatus -- flap-debounce", () => {
  it("does not flip status on a single failure from a fresh (never-checked) evidence row", () => {
    const result = nextEvidenceStatus(null, unreachable, now);
    expect(result).toEqual({ status: "unverified", consecutiveFailures: 1, lastCheckedAt: now });
  });

  it("does not flip status on a single failure following a prior live status", () => {
    const prior = { status: "live" as const, consecutiveFailures: 0 };
    const result = nextEvidenceStatus(prior, unreachable, now);
    expect(result.status).toBe("live");
    expect(result.consecutiveFailures).toBe(1);
  });

  it("flips to unreachable on the 2nd consecutive failure with no archive", () => {
    const s1 = nextEvidenceStatus(null, unreachable, now);
    const s2 = nextEvidenceStatus(s1, unreachable, now);
    expect(s2).toEqual({ status: "unreachable", consecutiveFailures: 2, lastCheckedAt: now });
  });

  it("flips to archived on the 2nd consecutive failure when the archive is reachable", () => {
    const s1 = nextEvidenceStatus(null, unreachableWithArchive, now);
    expect(s1.status).toBe("unverified");
    const s2 = nextEvidenceStatus(s1, unreachableWithArchive, now);
    expect(s2).toEqual({ status: "archived", consecutiveFailures: 2, lastCheckedAt: now });
  });

  it("flips to unreachable, not archived, when the archive itself is also down", () => {
    const s1 = nextEvidenceStatus(null, unreachableArchiveDown, now);
    const s2 = nextEvidenceStatus(s1, unreachableArchiveDown, now);
    expect(s2.status).toBe("unreachable");
  });

  it("a success always resets the counter and returns to live, however many failures preceded it", () => {
    const s1 = nextEvidenceStatus(null, unreachable, now);
    const s2 = nextEvidenceStatus(s1, unreachable, now);
    expect(s2.status).toBe("unreachable");
    const s3 = nextEvidenceStatus(s2, liveMatch, now);
    expect(s3).toEqual({ status: "live", consecutiveFailures: 0, lastCheckedAt: now });
  });

  it("keeps counting past 2 if failures continue -- consecutiveFailures is not capped at 2", () => {
    let state = nextEvidenceStatus(null, unreachable, now);
    state = nextEvidenceStatus(state, unreachable, now);
    state = nextEvidenceStatus(state, unreachable, now);
    expect(state.consecutiveFailures).toBe(3);
    expect(state.status).toBe("unreachable");
  });
});

describe("nextEvidenceStatus -- drift", () => {
  it("flips to drifted on the 2nd consecutive content mismatch, even with a reachable archive", () => {
    const s1 = nextEvidenceStatus(null, liveMismatch, now);
    expect(s1.status).toBe("unverified");
    const s2 = nextEvidenceStatus(s1, { ...liveMismatch, archiveReachable: true }, now);
    expect(s2.status).toBe("drifted");
  });

  it("does not confuse drift (reachable, wrong content) with unreachable (not reachable at all)", () => {
    const s1 = nextEvidenceStatus(null, liveMismatch, now);
    const s2 = nextEvidenceStatus(s1, liveMismatch, now);
    expect(s2.status).toBe("drifted");
    expect(s2.status).not.toBe("unreachable");
  });
});

describe("nextEvidenceStatus -- pin/upload kinds with no comparison target", () => {
  it("resolves a reachable check with contentMatches: null (pin/upload kinds) directly to live", () => {
    const result = nextEvidenceStatus(null, liveNoComparison, now);
    expect(result).toEqual({ status: "live", consecutiveFailures: 0, lastCheckedAt: now });
  });
});
