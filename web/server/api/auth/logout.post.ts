import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { clearSessionToken, readSessionToken } from '~~/server/utils/session';

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  if (readSessionToken(event)) {
    // The cookie is cleared even when the token was already revoked upstream.
    await createOrigoApiClient(event)('/auth/logout', { method: 'POST' }).catch(() => undefined);
  }

  clearSessionToken(event);

  return { ok: true };
});
