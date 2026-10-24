import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectParamsSchema } from '~~/server/utils/route-params';

const MAX_BODY_BYTES = 1_024;
// The person types the project code; the API checks it matches exactly.
const bodySchema = z.object({ confirmCode: z.string().trim().min(1).max(16) });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));
  const body = await readValidatedJsonBody(event, bodySchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)(`/projects/${code}/forever`, { method: 'DELETE', body });

  return { ok: true };
});
