import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { adminUserDtoSchema } from '~~/server/integrations/origo-api/dto/team.dto';
import { userIdSchema } from '~~/server/utils/route-params';
import { accountUpdateSchema } from '~~/server/utils/team-schemas';
import type { AdminUser } from '~~/shared/contracts/member';

const MAX_BODY_BYTES = 2_048;
const paramsSchema = z.object({ user: userIdSchema });

export default defineApiHandler(async (event): Promise<AdminUser> => {
  const { user } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, accountUpdateSchema, MAX_BODY_BYTES);

  return adminUserDtoSchema.parse(await createOrigoApiClient(event)(`/admin/users/${user}`, { method: 'PATCH', body })).data;
});
