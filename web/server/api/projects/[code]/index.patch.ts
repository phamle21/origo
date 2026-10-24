import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectParamsSchema } from '~~/server/utils/route-params';
import { projectUpdateSchema } from '~~/server/utils/team-schemas';

const MAX_BODY_BYTES = 32 * 1_024;

// The API answers with the whole project; the page reloads its own data afterwards, so nothing is returned.
export default defineApiHandler(async (event): Promise<{ code: string }> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));
  const body = await readValidatedJsonBody(event, projectUpdateSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)(`/projects/${code}/details`, { method: 'PATCH', body });

  return { code };
});
