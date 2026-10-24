import { Readable } from 'node:stream';
import { describe, expect, test } from 'vitest';
import { readLimitedJsonBody } from '~~/server/utils/read-limited-json-body';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import type { H3Event } from 'h3';

function createEvent(chunks: string[]): H3Event {
  return {
    node: {
      req: Readable.from(chunks),
    },
  } as unknown as H3Event;
}

describe('readLimitedJsonBody', () => {
  test('parses a JSON body at the exact byte limit', async () => {
    const body = JSON.stringify({ message: '🚀' });

    await expect(readLimitedJsonBody(createEvent([body]), Buffer.byteLength(body))).resolves.toEqual({ message: '🚀' });
  });

  test('rejects the streamed body as soon as its actual size exceeds the limit', async () => {
    const body = JSON.stringify({ message: 'oversized' });
    const result = readLimitedJsonBody(createEvent([body.slice(0, 5), body.slice(5)]), Buffer.byteLength(body) - 1);

    await expect(result).rejects.toMatchObject({ code: API_ERROR_CODES.payloadTooLarge, statusCode: 413 });
  });

  test('rejects invalid JSON as a bad request', async () => {
    await expect(readLimitedJsonBody(createEvent(['{"message":']), 100)).rejects.toMatchObject({ statusCode: 400 });
  });
});
