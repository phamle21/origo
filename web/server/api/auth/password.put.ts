import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { passwordChangeSchema } from '~~/server/utils/team-schemas';

const MAX_BODY_BYTES = 2_048;

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { currentPassword, password, passwordConfirmation } = await readValidatedJsonBody(event, passwordChangeSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)('/me/password', {
    method: 'PUT',
    body: { currentPassword, password, password_confirmation: passwordConfirmation },
  });

  return { ok: true };
});
