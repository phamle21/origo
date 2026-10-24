import { z } from 'zod';
import { CLIENT_ERROR_REPORT_LIMITS, CLIENT_ERROR_SOURCES } from '~~/shared/logging/error-report';

// Unknown keys are rejected: the payload is browser-supplied and must stay bounded before it is logged.
export const clientErrorReportSchema = z.strictObject({
  message: z.string().trim().min(1).max(CLIENT_ERROR_REPORT_LIMITS.messageLength),
  source: z.enum(CLIENT_ERROR_SOURCES),
  severity: z.enum(['warn', 'error', 'fatal']),
  url: z.string().trim().min(1).max(CLIENT_ERROR_REPORT_LIMITS.urlLength),
  occurredAt: z.iso.datetime(),
  stack: z.string().max(CLIENT_ERROR_REPORT_LIMITS.stackLength).optional(),
  component: z.string().max(CLIENT_ERROR_REPORT_LIMITS.componentLength).optional(),
});

export type ValidatedClientErrorReport = z.infer<typeof clientErrorReportSchema>;
