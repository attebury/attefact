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

assert(isCheckDue(null) === true, "never-checked is always due");
const now = new Date("2026-08-09T12:00:00Z");
assert(isCheckDue(new Date("2026-08-09T00:00:00Z"), now) === false, "12h-old check is not due (24h TTL)");
assert(isCheckDue(new Date("2026-08-08T00:00:00Z"), now) === true, "36h-old check is due");

const s1 = nextEvidenceStatus(null, { reachable: false, contentMatches: null }, now);
assert(s1.status === "unverified" && s1.consecutiveFailures === 1, "1st failure does not flip status");
const s2 = nextEvidenceStatus(s1, { reachable: false, contentMatches: null }, now);
assert(s2.status === "unreachable" && s2.consecutiveFailures === 2, "2nd consecutive failure flips to unreachable");
const s3 = nextEvidenceStatus(s2, { reachable: true, contentMatches: true }, now);
assert(s3.status === "live" && s3.consecutiveFailures === 0, "a success resets to live and clears the counter");
const s4 = nextEvidenceStatus(null, { reachable: true, contentMatches: false }, now);
const s5 = nextEvidenceStatus(s4, { reachable: true, contentMatches: false }, now);
assert(s5.status === "drifted", "2 consecutive hash-mismatches flips to drifted, not unreachable");

console.log("\nAll attefact pure-logic checks passed.");
