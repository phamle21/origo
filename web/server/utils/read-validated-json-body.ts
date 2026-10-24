import type { H3Event } from 'h3';
import type { z } from 'zod';
import { createAppError } from '~~/server/exceptions/app-error';
import { toApiErrorFields } from '~~/server/exceptions/normalize-error';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import { readLimitedJsonBody } from './read-limited-json-body';

/**
 * Reads a bounded JSON body and validates it. A failure is the caller's input, so it is reported as
 * VALIDATION_FAILED with field issues rather than as a broken upstream response.
 */
export async function readValidatedJsonBody<TSchema extends z.ZodType>(event: H3Event, schema: TSchema, maxBytes: number): Promise<z.infer<TSchema>> {
  const result = schema.safeParse(await readLimitedJsonBody(event, maxBytes));

  if (!result.success) {
    throw createAppError(API_ERROR_CODES.validationFailed, { fields: toApiErrorFields(result.error), cause: result.error });
  }

  return result.data;
}
