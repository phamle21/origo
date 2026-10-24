import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectCodeSchema, screenCodeSchema } from '~~/server/utils/route-params';
import { screenTextsSchema } from '~~/server/utils/screen-editor-schemas';

const MAX_BODY_BYTES = 16 * 1_024;
const paramsSchema = z.object({ code: projectCodeSchema, screen: screenCodeSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, screen } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, screenTextsSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)(`/projects/${code}/screens/${screen}`, { method: 'PATCH', body });

  return { ok: true };
});
