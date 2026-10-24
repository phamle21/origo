import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectCodeSchema, screenCodeSchema } from '~~/server/utils/route-params';
import { pointsPayloadSchema } from '~~/server/utils/screen-editor-schemas';

// Sixty fully written points in two languages stay well under this bound.
const MAX_BODY_BYTES = 1_024 * 1_024;
const paramsSchema = z.object({ code: projectCodeSchema, screen: screenCodeSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, screen } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, pointsPayloadSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)(`/projects/${code}/screens/${screen}/points`, { method: 'PUT', body });

  return { ok: true };
});
