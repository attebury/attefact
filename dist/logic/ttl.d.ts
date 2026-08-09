/**
 * docs/decisions/0005. No fixed-timer polling -- a consuming app calls
 * this at the point evidence is actually surfaced to decide whether a
 * lazy re-check is due, bounded by a TTL rather than checked on every
 * view.
 */
export declare const DEFAULT_TTL_MS: number;
export declare function isCheckDue(lastCheckedAt: Date | null, now?: Date, ttlMs?: number): boolean;
