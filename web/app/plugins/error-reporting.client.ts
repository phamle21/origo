import { CLIENT_ERROR_REPORT_LIMITS, type ClientErrorReport, type ClientErrorSource } from '~~/shared/logging/error-report';

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : 'unknown client error';
}

function toStack(error: unknown): string | undefined {
  return error instanceof Error && error.stack ? error.stack : undefined;
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  if (!config.public.errorReportingEnabled) {
    return;
  }

  // Bounded per page load so a repeating render error cannot flood the endpoint from one browser.
  let sentReportCount = 0;

  function reportError(error: unknown, source: ClientErrorSource, component?: string): void {
    if (sentReportCount >= CLIENT_ERROR_REPORT_LIMITS.reportsPerPageLoad) {
      return;
    }

    sentReportCount += 1;

    const stack = toStack(error);
    const report: ClientErrorReport = {
      message: truncate(toMessage(error), CLIENT_ERROR_REPORT_LIMITS.messageLength),
      source,
      severity: 'error',
      url: truncate(window.location.href, CLIENT_ERROR_REPORT_LIMITS.urlLength),
      occurredAt: new Date().toISOString(),
      ...(stack ? { stack: truncate(stack, CLIENT_ERROR_REPORT_LIMITS.stackLength) } : {}),
      ...(component ? { component: truncate(component, CLIENT_ERROR_REPORT_LIMITS.componentLength) } : {}),
    };

    // Reporting a failure must never surface a second failure to the visitor.
    void $fetch('/api/_error-report', { method: 'POST', body: report, retry: 0 }).catch(() => {});
  }

  nuxtApp.hook('vue:error', (error, _instance, info) => {
    reportError(error, 'vue', info);
  });

  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message, 'window');
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, 'unhandledRejection');
  });
});
