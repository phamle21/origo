import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { planScreensSchema } from '~~/server/utils/plan-schemas';
import { projectCodeSchema, ulidSchema } from '~~/server/utils/route-params';

const MAX_BODY_BYTES = 4 * 1_024;
const paramsSchema = z.object({ code: projectCodeSchema, item: ulidSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, item } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, planScreensSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)(`/projects/${code}/plan/items/${item.toLowerCase()}/screens`, { method: 'PUT', body });

  return { ok: true };
});
