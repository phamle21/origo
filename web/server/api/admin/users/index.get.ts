import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { adminUserListDtoSchema } from '~~/server/integrations/origo-api/dto/team.dto';
import type { AdminUser } from '~~/shared/contracts/member';

const querySchema = z.object({ q: z.string().trim().max(100).default('') });

export default defineApiHandler(async (event): Promise<AdminUser[]> => {
  const { q } = await getValidatedQuery(event, (value) => querySchema.parse(value));

  return adminUserListDtoSchema.parse(await createOrigoApiClient(event)('/admin/users', { query: { q } })).data;
});
