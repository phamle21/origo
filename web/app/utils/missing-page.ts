import { API_ERROR_CODES, type ApiErrorCode, type ApiErrorData } from '~~/shared/contracts/api-error';

// A code in the URL that is unknown or malformed means the page itself does not exist.
const MISSING_PAGE_CODES: ReadonlySet<ApiErrorCode> = new Set([API_ERROR_CODES.notFound, API_ERROR_CODES.validationFailed]);

export function isMissingPageError(error: ApiErrorData | null): boolean {
  return error !== null && MISSING_PAGE_CODES.has(error.code);
}
