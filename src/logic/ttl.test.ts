import { describe, expect, it } from "vitest";
import { DEFAULT_TTL_MS, isCheckDue } from "./ttl.js";

describe("isCheckDue", () => {
  const now = new Date("2026-08-09T12:00:00Z");

  it("is always due when never checked", () => {
    expect(isCheckDue(null, now)).toBe(true);
  });

  it("is not due for a check well inside the TTL", () => {
    expect(isCheckDue(new Date("2026-08-09T00:00:00Z"), now)).toBe(false);
  });

  it("is due for a check well past the TTL", () => {
    expect(isCheckDue(new Date("2026-08-08T00:00:00Z"), now)).toBe(true);
  });

  it("is not due at exactly the TTL boundary (strictly greater-than, not >=)", () => {
    const lastCheckedAt = new Date(now.getTime() - DEFAULT_TTL_MS);
    expect(isCheckDue(lastCheckedAt, now)).toBe(false);
  });

  it("is due one millisecond past the TTL boundary", () => {
    const lastCheckedAt = new Date(now.getTime() - DEFAULT_TTL_MS - 1);
    expect(isCheckDue(lastCheckedAt, now)).toBe(true);
  });

  it("respects a custom TTL override", () => {
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    expect(isCheckDue(oneHourAgo, now, 30 * 60 * 1000)).toBe(true);
    expect(isCheckDue(oneHourAgo, now, 2 * 60 * 60 * 1000)).toBe(false);
  });
});
