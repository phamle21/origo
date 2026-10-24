import { createAppError } from '~~/server/exceptions/app-error';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { meDtoSchema } from '~~/server/integrations/origo-api/dto/screen-map.dto';
import { clearSessionToken, readSessionToken } from '~~/server/utils/session';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import type { CurrentUser } from '~~/shared/contracts/auth';

export default defineApiHandler(async (event): Promise<CurrentUser> => {
  if (!readSessionToken(event)) {
    throw createAppError(API_ERROR_CODES.unauthenticated);
  }

  try {
    return meDtoSchema.parse(await createOrigoApiClient(event)('/me')).data;
  } catch (cause) {
    // An expired or revoked token leaves nothing useful in the cookie.
    clearSessionToken(event);
    throw cause;
  }
});
