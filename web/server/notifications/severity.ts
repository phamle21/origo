import type { ErrorSeverity } from '~~/shared/types/severity';

const SEVERITY_RANK: Record<ErrorSeverity, number> = {
  info: 10,
  warn: 20,
  error: 30,
  fatal: 40,
};

/** Returns undefined for an empty or unknown configuration value so a fallback can apply. */
export function toSeverity(value: string | undefined): ErrorSeverity | undefined {
  return value && value in SEVERITY_RANK ? (value as ErrorSeverity) : undefined;
}

export function isSeverityAtLeast(severity: ErrorSeverity, threshold: ErrorSeverity): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[threshold];
}
