/**
 * No fixed-timer polling -- a consuming app calls this at the point
 * evidence is actually surfaced to decide whether a lazy re-check is
 * due, bounded by a TTL rather than checked on every view.
 */
export const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
export function isCheckDue(lastCheckedAt, now = new Date(), ttlMs = DEFAULT_TTL_MS) {
    if (lastCheckedAt === null)
        return true;
    return now.getTime() - lastCheckedAt.getTime() > ttlMs;
}
