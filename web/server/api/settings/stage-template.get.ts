import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { localizedTextDtoSchema } from '~~/server/integrations/origo-api/dto/screen-map.dto';
import type { StageTemplateEntry } from '~~/shared/contracts/plan';

const stageTemplateDtoSchema = z.object({
  data: z.array(z.object({ key: z.string(), name: localizedTextDtoSchema, color: z.string().regex(/^#[0-9a-f]{6}$/i) })),
});

export default defineApiHandler(async (event): Promise<StageTemplateEntry[]> => {
  return stageTemplateDtoSchema.parse(await createOrigoApiClient(event)('/admin/settings/stage-template')).data;
});
