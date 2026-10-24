import type { ErrorSeverity } from '../types/severity';

/** Bounds applied by the browser before sending and enforced again by the server endpoint. */
export const CLIENT_ERROR_REPORT_LIMITS = {
  messageLength: 512,
  stackLength: 4_096,
  urlLength: 2_048,
  componentLength: 256,
  reportsPerPageLoad: 5,
} as const;

export const CLIENT_ERROR_SOURCES = ['vue', 'window', 'unhandledRejection'] as const;

export type ClientErrorSource = (typeof CLIENT_ERROR_SOURCES)[number];

export interface ClientErrorReport {
  message: string;
  source: ClientErrorSource;
  severity: ErrorSeverity;
  url: string;
  /** ISO-8601 timestamp taken in the browser. */
  occurredAt: string;
  stack?: string;
  component?: string;
}

export interface ClientErrorReportResult {
  /** False when the report was dropped as a duplicate inside the deduplication window. */
  isAccepted: boolean;
}
