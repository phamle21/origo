import { describe, expect, test } from 'vitest';
import { createRateLimiter } from '~~/server/logging/rate-limit';

const START = 1_700_000_000_000;

describe('createRateLimiter', () => {
  test('allows requests up to the configured maximum', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowSeconds: 60 });

    expect(limiter.check('client', START).isAllowed).toBe(true);
    expect(limiter.check('client', START + 1_000).isAllowed).toBe(true);
  });

  test('blocks the request after the maximum and reports the remaining window', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowSeconds: 60 });

    limiter.check('client', START);
    limiter.check('client', START);

    expect(limiter.check('client', START + 10_000)).toEqual({ isAllowed: false, retryAfterSeconds: 50 });
  });

  test('starts a new window once the previous one elapses', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowSeconds: 60 });

    limiter.check('client', START);

    expect(limiter.check('client', START + 59_999).isAllowed).toBe(false);
    expect(limiter.check('client', START + 60_000).isAllowed).toBe(true);
  });

  test('counts each key separately', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowSeconds: 60 });

    expect(limiter.check('first', START).isAllowed).toBe(true);
    expect(limiter.check('second', START).isAllowed).toBe(true);
    expect(limiter.check('first', START).isAllowed).toBe(false);
  });

  test('drops the oldest key once the tracked-key bound is reached', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowSeconds: 60, maxTrackedKeys: 2 });

    limiter.check('first', START);
    limiter.check('second', START);
    limiter.check('third', START);

    expect(limiter.check('first', START).isAllowed).toBe(true);
    expect(limiter.check('third', START).isAllowed).toBe(false);
  });
});
