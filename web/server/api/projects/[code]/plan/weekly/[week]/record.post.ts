import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectCodeSchema, weekSchema } from '~~/server/utils/route-params';

const paramsSchema = z.object({ code: projectCodeSchema, week: weekSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, week } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));

  await createOrigoApiClient(event)(`/projects/${code}/plan/weekly/${week}/record`, { method: 'POST' });

  return { ok: true };
});
