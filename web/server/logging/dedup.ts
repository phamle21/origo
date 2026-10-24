export interface DeduplicatorOptions {
  /** Zero or a negative value disables deduplication. */
  windowSeconds: number;
  maxTrackedKeys?: number;
}

export interface Deduplicator {
  shouldAccept(key: string, now?: number): boolean;
}

const DEFAULT_MAX_TRACKED_KEYS = 1_000;

/**
 * Suppresses a repeated key inside its window. Like the rate limiter, this is per-instance state and
 * not a cross-instance guarantee.
 */
export function createDeduplicator(options: DeduplicatorOptions): Deduplicator {
  const windowMilliseconds = options.windowSeconds * 1_000;
  const maxTrackedKeys = options.maxTrackedKeys ?? DEFAULT_MAX_TRACKED_KEYS;
  const acceptedAt = new Map<string, number>();

  return {
    shouldAccept(key, now = Date.now()) {
      if (windowMilliseconds <= 0) {
        return true;
      }

      const seenAt = acceptedAt.get(key);

      if (seenAt !== undefined && now - seenAt < windowMilliseconds) {
        return false;
      }

      if (acceptedAt.size >= maxTrackedKeys) {
        for (const [trackedKey, trackedAt] of acceptedAt) {
          if (now - trackedAt >= windowMilliseconds) {
            acceptedAt.delete(trackedKey);
          }
        }
      }
      if (acceptedAt.size >= maxTrackedKeys) {
        const oldestKey = acceptedAt.keys().next().value;

        if (oldestKey !== undefined) {
          acceptedAt.delete(oldestKey);
        }
      }

      acceptedAt.set(key, now);

      return true;
    },
  };
}
