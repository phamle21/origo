import { z } from 'zod';
import { CAPTURE_TIMEOUT_MILLISECONDS, createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectCodeSchema, screenCodeSchema } from '~~/server/utils/route-params';

const paramsSchema = z.object({ code: projectCodeSchema, screen: screenCodeSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, screen } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));

  await createOrigoApiClient(event)(`/projects/${code}/screens/${screen}/recapture`, { method: 'POST', timeout: CAPTURE_TIMEOUT_MILLISECONDS });

  return { ok: true };
});
