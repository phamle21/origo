import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectCodeSchema, ulidSchema } from '~~/server/utils/route-params';

const paramsSchema = z.object({ code: projectCodeSchema, item: ulidSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, item } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));

  await createOrigoApiClient(event)(`/projects/${code}/plan/items/${item.toLowerCase()}`, { method: 'DELETE' });

  return { ok: true };
});
