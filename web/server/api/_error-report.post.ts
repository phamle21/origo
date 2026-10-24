import { createAppError } from '~~/server/exceptions/app-error';
import { createDeduplicator, type Deduplicator } from '~~/server/logging/dedup';
import { clientErrorReportSchema } from '~~/server/logging/error-report-schema';
import { logWarn } from '~~/server/logging/logger';
import { createRateLimiter, type RateLimiter } from '~~/server/logging/rate-limit';
import { toSafeLogUrl } from '~~/server/logging/redact';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import type { ClientErrorReportResult } from '~~/shared/logging/error-report';

interface Guards {
  rateLimiter: RateLimiter;
  deduplicator: Deduplicator;
}

// Process-wide guards for a public endpoint. The state is shared by design and holds no per-user data,
// so it does not leak between SSR requests.
let guards: Guards | null = null;

function getGuards(config: { rateLimit: { maxRequests: number; windowSeconds: number } }): Guards {
  guards ??= {
    rateLimiter: createRateLimiter(config.rateLimit),
    deduplicator: createDeduplicator({ windowSeconds: config.rateLimit.windowSeconds }),
  };

  return guards;
}

export default defineApiHandler(async (event): Promise<ClientErrorReportResult> => {
  const config = useRuntimeConfig(event);

  if (!config.public.errorReportingEnabled) {
    throw createAppError(API_ERROR_CODES.notFound, { internalMessage: 'client error reporting is disabled' });
  }

  const declaredBytes = Number(getRequestHeader(event, 'content-length') ?? 0);

  if (declaredBytes > config.errorReporting.maxPayloadBytes) {
    throw createAppError(API_ERROR_CODES.payloadTooLarge, {
      internalMessage: `client error report declared ${declaredBytes} bytes`,
    });
  }

  const { rateLimiter, deduplicator } = getGuards(config.errorReporting);
  const clientAddress = getClientAddress(event);
  const verdict = rateLimiter.check(clientAddress);

  if (!verdict.isAllowed) {
    throw createAppError(API_ERROR_CODES.rateLimited, { retryAfterSeconds: verdict.retryAfterSeconds });
  }

  const body = await readLimitedJsonBody(event, config.errorReporting.maxPayloadBytes);
  const report = clientErrorReportSchema.parse(body);

  if (!deduplicator.shouldAccept([report.source, report.message].join('|'))) {
    return { isAccepted: false };
  }

  logWarn(report.message, {
    code: 'CLIENT_ERROR_REPORT',
    severity: report.severity,
    requestId: getRequestId(event),
    method: event.method,
    path: toSafeLogUrl(report.url),
    source: `client:${report.source}`,
    component: report.component,
    occurredAt: report.occurredAt,
    error: report.stack ? { stack: report.stack } : undefined,
  });

  return { isAccepted: true };
});
