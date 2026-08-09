/**
 * docs/decisions/0005. No fixed-timer polling -- a consuming app calls
 * this at the point evidence is actually surfaced to decide whether a
 * lazy re-check is due, bounded by a TTL rather than checked on every
 * view.
 */
export const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export function isCheckDue(lastCheckedAt: Date | null, now: Date = new Date(), ttlMs: number = DEFAULT_TTL_MS): boolean {
  if (lastCheckedAt === null) return true;
  return now.getTime() - lastCheckedAt.getTime() > ttlMs;
}
