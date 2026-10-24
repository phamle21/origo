import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { resetPasswordDtoSchema } from '~~/server/integrations/origo-api/dto/team.dto';
import { userIdSchema } from '~~/server/utils/route-params';
import type { IssuedPassword } from '~~/shared/contracts/member';

const paramsSchema = z.object({ user: userIdSchema });

export default defineApiHandler(async (event): Promise<IssuedPassword> => {
  const { user } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));

  return resetPasswordDtoSchema.parse(await createOrigoApiClient(event)(`/admin/users/${user}/reset-password`, { method: 'POST' }));
});
