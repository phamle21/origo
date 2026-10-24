import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { createdAccountDtoSchema } from '~~/server/integrations/origo-api/dto/team.dto';
import { accountCreateSchema } from '~~/server/utils/team-schemas';
import type { IssuedPassword } from '~~/shared/contracts/member';

const MAX_BODY_BYTES = 2_048;

export default defineApiHandler(async (event): Promise<IssuedPassword> => {
  const body = await readValidatedJsonBody(event, accountCreateSchema, MAX_BODY_BYTES);
  const created = createdAccountDtoSchema.parse(await createOrigoApiClient(event)('/admin/users', { method: 'POST', body }));

  setResponseStatus(event, 201);

  return { user: created.data, temporaryPassword: created.temporaryPassword };
});
