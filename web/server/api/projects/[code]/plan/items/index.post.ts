import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { createdItemDtoSchema } from '~~/server/integrations/origo-api/dto/plan.dto';
import { planItemCreateSchema } from '~~/server/utils/plan-schemas';
import { projectParamsSchema } from '~~/server/utils/route-params';

const MAX_BODY_BYTES = 4 * 1_024;

export default defineApiHandler(async (event): Promise<{ id: string }> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));
  const body = await readValidatedJsonBody(event, planItemCreateSchema, MAX_BODY_BYTES);

  setResponseStatus(event, 201);

  return createdItemDtoSchema.parse(await createOrigoApiClient(event)(`/projects/${code}/plan/items`, { method: 'POST', body })).data;
});
