import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { ulidSchema } from '~~/server/utils/route-params';

const paramsSchema = z.object({ role: ulidSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { role } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));

  await createOrigoApiClient(event)(`/admin/project-roles/${role.toLowerCase()}`, { method: 'DELETE' });

  return { ok: true };
});
