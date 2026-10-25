import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { planWeeklyDtoSchema } from '~~/server/integrations/origo-api/dto/plan.dto';
import { projectParamsSchema } from '~~/server/utils/route-params';
import type { PlanWeeklyReport } from '~~/shared/contracts/plan';

export default defineApiHandler(async (event): Promise<PlanWeeklyReport> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));

  return planWeeklyDtoSchema.parse(await createOrigoApiClient(event)(`/projects/${code}/plan/weekly`)).data;
});
