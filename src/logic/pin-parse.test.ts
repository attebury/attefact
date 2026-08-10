import { describe, expect, it } from "vitest";
import { parseCommitUrl, parseMergedPrUrl, parseRepoUrl } from "./pin-parse.js";

describe("parseCommitUrl", () => {
  it("matches a real commit URL", () => {
    expect(parseCommitUrl("https://github.com/foo/bar/commit/abc1234")).toEqual({
      owner: "foo",
      repo: "bar",
      sha: "abc1234",
    });
  });

  it("matches a full 40-char SHA and a trailing slash", () => {
    const sha = "a".repeat(40);
    expect(parseCommitUrl(`https://github.com/foo/bar/commit/${sha}/`)).toEqual({
      owner: "foo",
      repo: "bar",
      sha,
    });
  });

  it("rejects a branch URL", () => {
    expect(parseCommitUrl("https://github.com/foo/bar/tree/main")).toBeNull();
  });

  it("rejects a non-GitHub host, even one that looks similar", () => {
    expect(parseCommitUrl("https://github.com.evil.com/foo/bar/commit/abc1234")).toBeNull();
    expect(parseCommitUrl("https://gitlab.com/foo/bar/commit/abc1234")).toBeNull();
  });

  it("rejects a SHA that's too short to be a real prefix or contains non-hex characters", () => {
    expect(parseCommitUrl("https://github.com/foo/bar/commit/abc12")).toBeNull();
    expect(parseCommitUrl("https://github.com/foo/bar/commit/xyz1234")).toBeNull();
  });
});

describe("parseMergedPrUrl", () => {
  it("matches a real PR URL", () => {
    expect(parseMergedPrUrl("https://github.com/foo/bar/pull/42")).toEqual({
      owner: "foo",
      repo: "bar",
      prNumber: 42,
    });
  });

  it("rejects a non-numeric PR reference", () => {
    expect(parseMergedPrUrl("https://github.com/foo/bar/pull/abc")).toBeNull();
  });
});

describe("parseRepoUrl", () => {
  it("matches a bare repo URL", () => {
    expect(parseRepoUrl("https://github.com/foo/bar")).toEqual({ owner: "foo", repo: "bar" });
  });

  it("rejects non-GitHub host", () => {
    expect(parseRepoUrl("https://gitlab.com/foo/bar")).toBeNull();
  });

  it("rejects a URL with extra path segments (not a bare repo root)", () => {
    expect(parseRepoUrl("https://github.com/foo/bar/issues")).toBeNull();
  });
});
