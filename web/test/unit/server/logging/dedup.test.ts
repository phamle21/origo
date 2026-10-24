import { describe, expect, test } from 'vitest';
import { createDeduplicator } from '~~/server/logging/dedup';

const START = 1_700_000_000_000;

describe('createDeduplicator', () => {
  test('accepts a key once inside its window', () => {
    const deduplicator = createDeduplicator({ windowSeconds: 300 });

    expect(deduplicator.shouldAccept('key', START)).toBe(true);
    expect(deduplicator.shouldAccept('key', START + 299_999)).toBe(false);
  });

  test('accepts the key again after the window elapses', () => {
    const deduplicator = createDeduplicator({ windowSeconds: 300 });

    deduplicator.shouldAccept('key', START);

    expect(deduplicator.shouldAccept('key', START + 300_000)).toBe(true);
  });

  test('accepts every key when deduplication is disabled', () => {
    const deduplicator = createDeduplicator({ windowSeconds: 0 });

    expect(deduplicator.shouldAccept('key', START)).toBe(true);
    expect(deduplicator.shouldAccept('key', START)).toBe(true);
  });

  test('keeps distinct keys independent', () => {
    const deduplicator = createDeduplicator({ windowSeconds: 300 });

    expect(deduplicator.shouldAccept('first', START)).toBe(true);
    expect(deduplicator.shouldAccept('second', START)).toBe(true);
  });
});
