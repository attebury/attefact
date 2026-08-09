/**
 * docs/decisions/0004, 0005. The rot-detection state machine, minus
 * the `archived` state (depends on docs/decisions/0003's archive
 * fallback capture, deferred).
 */
export type EvidenceStatusValue = "unverified" | "live" | "drifted" | "unreachable";

export type CheckResult = {
  reachable: boolean;
  /** null for pin kinds -- a commit SHA can't drift, only go unreachable. */
  contentMatches: boolean | null;
};

export type StatusRecord = {
  status: EvidenceStatusValue;
  consecutiveFailures: number;
};

/**
 * A single failed check must never flip status on its own (0005's
 * flap-debounce) -- it takes two consecutive non-live checks. A
 * success always resets the counter and returns to "live" regardless
 * of how many failures preceded it.
 */
export function nextEvidenceStatus(
  previous: StatusRecord | null,
  result: CheckResult,
  now: Date,
): { status: EvidenceStatusValue; consecutiveFailures: number; lastCheckedAt: Date } {
  const succeeded = result.reachable && result.contentMatches !== false;
  if (succeeded) {
    return { status: "live", consecutiveFailures: 0, lastCheckedAt: now };
  }

  const consecutiveFailures = (previous?.consecutiveFailures ?? 0) + 1;
  const priorStatus = previous?.status ?? "unverified";
  if (consecutiveFailures < 2) {
    return { status: priorStatus, consecutiveFailures, lastCheckedAt: now };
  }

  const status: EvidenceStatusValue = result.reachable ? "drifted" : "unreachable";
  return { status, consecutiveFailures, lastCheckedAt: now };
}
