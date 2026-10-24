import type { EventHandler, EventHandlerRequest, H3Event } from 'h3';
import { toAppError } from '~~/server/exceptions/normalize-error';
import { getRequestId } from './request-context';

/**
 * Wraps a Nitro route so every failure leaves the boundary as a normalized `ApiErrorData` payload with
 * a stable code, a client-safe message, and the request id. Logging and alerting stay in
 * `server/plugins/error.ts`, which reads the normalized error from the event context.
 */
export function defineApiHandler<TResponse>(
  handler: (event: H3Event) => Promise<TResponse> | TResponse,
): EventHandler<EventHandlerRequest, Promise<TResponse>> {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event);
    } catch (cause) {
      const appError = toAppError(cause);

      event.context.appError = appError;

      if (appError.retryAfterSeconds !== undefined) {
        setResponseHeader(event, 'retry-after', appError.retryAfterSeconds);
      }

      throw createError({
        statusCode: appError.statusCode,
        statusMessage: appError.publicMessage,
        message: appError.publicMessage,
        data: appError.toApiErrorData(getRequestId(event)),
        cause: appError,
      });
    }
  });
}
