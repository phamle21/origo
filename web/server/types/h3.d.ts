import type { AppError } from '~~/server/exceptions/app-error';

declare module 'h3' {
  interface H3EventContext {
    /** Correlation id assigned by `server/middleware/request-id.ts`. */
    requestId?: string;
    /** Normalized failure attached by `defineApiHandler` so `server/plugins/error.ts` can log its severity. */
    appError?: AppError;
  }
}
