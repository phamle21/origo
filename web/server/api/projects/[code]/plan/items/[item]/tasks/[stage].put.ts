import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { planTaskSchema } from '~~/server/utils/plan-schemas';
import { projectCodeSchema, ulidSchema } from '~~/server/utils/route-params';

// A note and a link of their full length fit.
const MAX_BODY_BYTES = 8 * 1_024;
const paramsSchema = z.object({ code: projectCodeSchema, item: ulidSchema, stage: ulidSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, item, stage } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, planTaskSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)(`/projects/${code}/plan/items/${item.toLowerCase()}/tasks/${stage.toLowerCase()}`, { method: 'PUT', body });

  return { ok: true };
});
