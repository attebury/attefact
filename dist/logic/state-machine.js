/**
 * A single failed check must never flip status on its own (0005's
 * flap-debounce) -- it takes two consecutive non-live checks. A
 * success always resets the counter and returns to "live" regardless
 * of how many failures preceded it.
 */
export function nextEvidenceStatus(previous, result, now) {
    const succeeded = result.reachable && result.contentMatches !== false;
    if (succeeded) {
        return { status: "live", consecutiveFailures: 0, lastCheckedAt: now };
    }
    const consecutiveFailures = (previous?.consecutiveFailures ?? 0) + 1;
    const priorStatus = previous?.status ?? "unverified";
    if (consecutiveFailures < 2) {
        return { status: priorStatus, consecutiveFailures, lastCheckedAt: now };
    }
    const status = result.reachable
        ? "drifted"
        : result.archiveReachable
            ? "archived"
            : "unreachable";
    return { status, consecutiveFailures, lastCheckedAt: now };
}
