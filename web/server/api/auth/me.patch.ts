import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { meDtoSchema } from '~~/server/integrations/origo-api/dto/screen-map.dto';
import { profileUpdateSchema } from '~~/server/utils/team-schemas';
import type { CurrentUser } from '~~/shared/contracts/auth';

const MAX_BODY_BYTES = 1_024;

export default defineApiHandler(async (event): Promise<CurrentUser> => {
  const body = await readValidatedJsonBody(event, profileUpdateSchema, MAX_BODY_BYTES);

  return meDtoSchema.parse(await createOrigoApiClient(event)('/me', { method: 'PATCH', body })).data;
});
