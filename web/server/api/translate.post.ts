import { createHash } from 'node:crypto';
import { z } from 'zod';
import { createAppError } from '~~/server/exceptions/app-error';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { translateText } from '~~/server/integrations/translation/client';
import { createRateLimiter, type RateLimiter } from '~~/server/logging/rate-limit';
import { logWarn } from '~~/server/logging/logger';
import { readSessionToken } from '~~/server/utils/session';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import { CONTENT_LOCALE_PATTERN } from '~~/shared/contracts/content';
import { MAX_TRANSLATION_CHARACTERS, MAX_TRANSLATION_TARGETS, type TranslationResult } from '~~/shared/contracts/translation';

const MAX_BODY_BYTES = 16_384;
const localeSchema = z.string().regex(CONTENT_LOCALE_PATTERN);
const bodySchema = z.object({
  text: z.string().trim().min(1).max(MAX_TRANSLATION_CHARACTERS),
  from: localeSchema,
  to: z.array(localeSchema).min(1).max(MAX_TRANSLATION_TARGETS),
});

// Process-wide, holds no user data beyond a hashed token, so it does not leak between requests.
let rateLimiter: RateLimiter | null = null;

export default defineApiHandler(async (event): Promise<TranslationResult> => {
  const token = readSessionToken(event);

  if (!token) {
    throw createAppError(API_ERROR_CODES.unauthenticated);
  }

  // The free providers are shared, so each signed-in person gets a modest budget.
  rateLimiter ??= createRateLimiter({ maxRequests: 30, windowSeconds: 60 });
  const verdict = rateLimiter.check(createHash('sha256').update(token).digest('hex'));

  if (!verdict.isAllowed) {
    throw createAppError(API_ERROR_CODES.rateLimited, { retryAfterSeconds: verdict.retryAfterSeconds });
  }

  const { text, from, to } = await readValidatedJsonBody(event, bodySchema, MAX_BODY_BYTES);

  // Only a valid session may spend the budget; an expired token fails here with 401.
  await createOrigoApiClient(event)('/me');

  const targets = [...new Set(to)].filter((locale) => locale !== from);
  const translated = await Promise.all(targets.map((locale) => translateText(text, from, locale)));

  if (targets.length && translated.every((value) => value === null)) {
    logWarn('every translation provider failed', { code: 'TRANSLATION_FAILED', requestId: getRequestId(event) });
    throw createAppError(API_ERROR_CODES.upstreamInvalidResponse, { internalMessage: 'translation providers failed' });
  }

  return { translations: Object.fromEntries(targets.map((locale, index) => [locale, translated[index] ?? null])) };
});
