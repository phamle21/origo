export interface RateLimitOptions {
  maxRequests: number;
  windowSeconds: number;
  /** Upper bound on tracked keys so an attacker cannot grow the map without limit. */
  maxTrackedKeys?: number;
}

export interface RateLimitVerdict {
  isAllowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitVerdict;
}

interface WindowState {
  count: number;
  startedAt: number;
}

const DEFAULT_MAX_TRACKED_KEYS = 10_000;

/**
 * Fixed-window limiter kept in process memory. It is a per-instance safeguard, not a distributed
 * guarantee; a deployment with several instances allows up to `maxRequests` per instance.
 */
export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const windowMilliseconds = options.windowSeconds * 1_000;
  const maxTrackedKeys = options.maxTrackedKeys ?? DEFAULT_MAX_TRACKED_KEYS;
  const windows = new Map<string, WindowState>();

  function evictExpired(now: number): void {
    for (const [key, state] of windows) {
      if (now - state.startedAt >= windowMilliseconds) {
        windows.delete(key);
      }
    }
  }

  return {
    check(key, now = Date.now()) {
      const state = windows.get(key);

      if (!state || now - state.startedAt >= windowMilliseconds) {
        if (windows.size >= maxTrackedKeys) {
          evictExpired(now);
        }
        if (windows.size >= maxTrackedKeys) {
          // Map iteration follows insertion order, so the oldest tracked key is dropped first.
          const oldestKey = windows.keys().next().value;

          if (oldestKey !== undefined) {
            windows.delete(oldestKey);
          }
        }
        windows.set(key, { count: 1, startedAt: now });

        return { isAllowed: true, retryAfterSeconds: 0 };
      }

      if (state.count >= options.maxRequests) {
        return { isAllowed: false, retryAfterSeconds: Math.ceil((state.startedAt + windowMilliseconds - now) / 1_000) };
      }

      state.count += 1;

      return { isAllowed: true, retryAfterSeconds: 0 };
    },
  };
}
