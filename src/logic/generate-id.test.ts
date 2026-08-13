import { describe, expect, it } from "vitest";
import { generateId } from "./generate-id.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("generateId", () => {
  it("returns a well-formed UUID", () => {
    expect(generateId()).toMatch(UUID_RE);
  });

  it("returns a different id on every call", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });
});
