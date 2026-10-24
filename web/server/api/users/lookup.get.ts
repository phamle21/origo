import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { userLookupDtoSchema } from '~~/server/integrations/origo-api/dto/team.dto';
import type { UserOption } from '~~/shared/contracts/member';

const querySchema = z.object({ q: z.string().trim().max(100).default('') });

export default defineApiHandler(async (event): Promise<UserOption[]> => {
  const { q } = await getValidatedQuery(event, (value) => querySchema.parse(value));

  return q.length < 2 ? [] : userLookupDtoSchema.parse(await createOrigoApiClient(event)('/users/lookup', { query: { q } })).data;
});
