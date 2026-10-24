import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectParamsSchema } from '~~/server/utils/route-params';

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));

  await createOrigoApiClient(event)(`/projects/${code}/archive`, { method: 'POST' });

  return { ok: true };
});
