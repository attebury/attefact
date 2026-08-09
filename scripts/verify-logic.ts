import { parseCommitUrl, parseMergedPrUrl, parseRepoUrl } from "../src/logic/pin-parse";
import { nextEvidenceStatus } from "../src/logic/state-machine";
import { isCheckDue } from "../src/logic/ttl";
import { tierOfKind, bindingOfKind } from "../src/logic/kind-taxonomy";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("OK:", msg);
}

assert(
  JSON.stringify(parseCommitUrl("https://github.com/foo/bar/commit/abc1234")) ===
    JSON.stringify({ owner: "foo", repo: "bar", sha: "abc1234" }),
  "parseCommitUrl matches a real commit URL",
);
assert(parseCommitUrl("https://github.com/foo/bar/tree/main") === null, "parseCommitUrl rejects a branch URL");
assert(
  JSON.stringify(parseMergedPrUrl("https://github.com/foo/bar/pull/42")) ===
    JSON.stringify({ owner: "foo", repo: "bar", prNumber: 42 }),
  "parseMergedPrUrl matches a real PR URL",
);
assert(parseRepoUrl("https://github.com/foo/bar") !== null, "parseRepoUrl matches a bare repo URL");
assert(parseRepoUrl("https://gitlab.com/foo/bar") === null, "parseRepoUrl rejects non-GitHub host");

assert(tierOfKind("merged_pr") === 1, "merged_pr is tier 1");
assert(tierOfKind("repo") === 2, "repo is tier 2");
assert(bindingOfKind("commit") === "pin", "commit is a pin kind");
assert(bindingOfKind("deploy") === "snapshot", "deploy is a snapshot kind");
assert(tierOfKind("certification") === 1, "certification is tier 1 (third-party issued)");
assert(bindingOfKind("certification") === "snapshot", "certification is a snapshot kind, same as deploy/talk_external");
assert(tierOfKind("document") === 3, "document is tier 3 (self-hosted, weakest)");
assert(tierOfKind("screen_recording") === 3, "screen_recording is tier 3 (self-hosted, weakest)");
assert(bindingOfKind("document") === "upload", "document is an upload kind, not pin or snapshot");
assert(bindingOfKind("screen_recording") === "upload", "screen_recording is an upload kind, not pin or snapshot");

assert(isCheckDue(null) === true, "never-checked is always due");
const now = new Date("2026-08-09T12:00:00Z");
assert(isCheckDue(new Date("2026-08-09T00:00:00Z"), now) === false, "12h-old check is not due (24h TTL)");
assert(isCheckDue(new Date("2026-08-08T00:00:00Z"), now) === true, "36h-old check is due");

const s1 = nextEvidenceStatus(null, { reachable: false, contentMatches: null, archiveReachable: null }, now);
assert(s1.status === "unverified" && s1.consecutiveFailures === 1, "1st failure does not flip status");
const s2 = nextEvidenceStatus(s1, { reachable: false, contentMatches: null, archiveReachable: null }, now);
assert(s2.status === "unreachable" && s2.consecutiveFailures === 2, "2nd consecutive failure with no archive flips to unreachable");
const s3 = nextEvidenceStatus(s2, { reachable: true, contentMatches: true, archiveReachable: null }, now);
assert(s3.status === "live" && s3.consecutiveFailures === 0, "a success resets to live and clears the counter");
const s4 = nextEvidenceStatus(null, { reachable: true, contentMatches: false, archiveReachable: null }, now);
const s5 = nextEvidenceStatus(s4, { reachable: true, contentMatches: false, archiveReachable: true }, now);
assert(s5.status === "drifted", "2 consecutive hash-mismatches flips to drifted, not archived, even with a reachable archive");

const a1 = nextEvidenceStatus(null, { reachable: false, contentMatches: null, archiveReachable: true }, now);
assert(
  a1.status === "unverified" && a1.consecutiveFailures === 1,
  "1st failure does not jump straight to archived, even with a reachable archive (debounce still holds)",
);
const a2 = nextEvidenceStatus(a1, { reachable: false, contentMatches: null, archiveReachable: true }, now);
assert(a2.status === "archived" && a2.consecutiveFailures === 2, "2nd consecutive failure with a reachable archive flips to archived, not unreachable");

// upload kinds (document/screen_recording): a reachable check with
// contentMatches: null (nothing external to compare against, we own
// the only copy) resolves straight to "live", same as a pin-kind
// success -- no attefact logic change was needed for this, confirmed
// here rather than just by reading the branch.
const u1 = nextEvidenceStatus(null, { reachable: true, contentMatches: null, archiveReachable: null }, now);
assert(u1.status === "live" && u1.consecutiveFailures === 0, "upload-kind reachable check resolves directly to live");

console.log("\nAll attefact pure-logic checks passed.");
