import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { userMembershipListDtoSchema } from '~~/server/integrations/origo-api/dto/team.dto';
import { userIdSchema } from '~~/server/utils/route-params';
import type { UserMembership } from '~~/shared/contracts/member';

const paramsSchema = z.object({ user: userIdSchema });

export default defineApiHandler(async (event): Promise<UserMembership[]> => {
  const { user } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));

  return userMembershipListDtoSchema.parse(await createOrigoApiClient(event)(`/admin/users/${user}/projects`)).data;
});
