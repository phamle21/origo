import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { planStagesSchema } from '~~/server/utils/plan-schemas';
import { projectParamsSchema } from '~~/server/utils/route-params';

const MAX_BODY_BYTES = 16 * 1_024;

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));
  const body = await readValidatedJsonBody(event, planStagesSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)(`/projects/${code}/plan/stages`, { method: 'PUT', body });

  return { ok: true };
});
