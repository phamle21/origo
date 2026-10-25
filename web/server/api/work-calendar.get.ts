import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { workCalendarDtoSchema } from '~~/server/integrations/origo-api/dto/plan.dto';
import type { WorkCalendarDay } from '~~/shared/contracts/plan';

export default defineApiHandler(
  async (event): Promise<WorkCalendarDay[]> => workCalendarDtoSchema.parse(await createOrigoApiClient(event)('/work-calendar')).data,
);
