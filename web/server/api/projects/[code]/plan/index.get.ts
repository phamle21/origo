import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectPlanDtoSchema } from '~~/server/integrations/origo-api/dto/plan.dto';
import { projectParamsSchema } from '~~/server/utils/route-params';
import type { ProjectPlan } from '~~/shared/contracts/plan';

export default defineApiHandler(async (event): Promise<ProjectPlan> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));

  return projectPlanDtoSchema.parse(await createOrigoApiClient(event)(`/projects/${code}/plan`)).data;
});
