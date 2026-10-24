import { createError, type H3Event } from 'h3';
import { createAppError } from '~~/server/exceptions/app-error';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';

export async function readLimitedJsonBody(event: H3Event, maxBytes: number): Promise<unknown> {
  const chunks: Buffer[] = [];
  let receivedBytes = 0;

  for await (const chunk of event.node.req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    receivedBytes += buffer.byteLength;

    if (receivedBytes > maxBytes) {
      throw createAppError(API_ERROR_CODES.payloadTooLarge, {
        internalMessage: `request body exceeded ${maxBytes} bytes`,
      });
    }

    chunks.push(buffer);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch (cause) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body', cause });
  }
}
