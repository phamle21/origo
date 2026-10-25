import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { planWeekSchema } from '~~/server/utils/plan-schemas';
import { projectCodeSchema, weekSchema } from '~~/server/utils/route-params';

const MAX_BODY_BYTES = 32 * 1_024;
const paramsSchema = z.object({ code: projectCodeSchema, week: weekSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, week } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, planWeekSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)(`/projects/${code}/plan/weekly/${week}`, { method: 'PATCH', body });

  return { ok: true };
});
