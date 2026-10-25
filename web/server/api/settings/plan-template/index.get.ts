import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { planTemplateDtoSchema } from '~~/server/integrations/origo-api/dto/plan.dto';
import type { PlanExcelTemplate } from '~~/shared/contracts/plan';

export default defineApiHandler(
  async (event): Promise<PlanExcelTemplate | null> => planTemplateDtoSchema.parse(await createOrigoApiClient(event)('/admin/settings/plan-template')).data,
);
