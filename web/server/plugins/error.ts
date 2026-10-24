import { AppError } from '~~/server/exceptions/app-error';
import { configureLogger, logError, logWarn } from '~~/server/logging/logger';
import { createErrorNotifier } from '~~/server/notifications/dispatcher';
import type { ErrorNotifyConfig } from '~~/server/notifications/types';
import { getRequestId } from '~~/server/utils/request-context';
import type { ErrorSeverity } from '~~/shared/types/severity';

function getStatusCode(error: unknown): number {
  const candidate = (error as { statusCode?: unknown }).statusCode;

  return typeof candidate === 'number' ? candidate : 500;
}

// Single place where a server failure is logged and alerted. Handlers and components must not repeat it.
export default defineNitroPlugin((nitroApp) => {
  const runtimeConfig = useRuntimeConfig();
  configureLogger(runtimeConfig.logging);
  const notifier = createErrorNotifier(runtimeConfig.errorNotify as ErrorNotifyConfig);

  nitroApp.hooks.hook('error', (error, { event }) => {
    const appError = event?.context.appError instanceof AppError ? event.context.appError : undefined;
    const statusCode = appError?.statusCode ?? getStatusCode(error);
    const severity: ErrorSeverity = appError?.severity ?? (statusCode >= 500 ? 'error' : 'warn');
    const requestId = event ? getRequestId(event) : 'unassigned';
    const context = {
      code: appError?.code ?? 'UNHANDLED_ERROR',
      statusCode,
      severity,
      requestId,
      method: event?.method,
      path: event?.path,
      source: 'server',
      // The normalized error keeps the original failure as its cause, which is what identifies the origin.
      error: appError ?? error,
    };

    // The log carries the internal message; only the response carries the public one.
    const message = appError?.message ?? error.message;

    if (severity === 'warn' || severity === 'info') {
      logWarn(message, context);

      return;
    }

    logError(message, context);

    void notifier.notify({
      code: context.code,
      statusCode,
      severity,
      message: appError?.publicMessage ?? 'An unexpected error occurred.',
      requestId,
      source: context.source,
      occurredAt: new Date().toISOString(),
      method: event?.method,
      path: event?.path,
    });
  });
});
