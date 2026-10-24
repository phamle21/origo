import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectCodeSchema, ulidSchema } from '~~/server/utils/route-params';

const paramsSchema = z.object({ code: projectCodeSchema, member: ulidSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, member } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));

  await createOrigoApiClient(event)(`/projects/${code}/members/${member.toLowerCase()}`, { method: 'DELETE' });

  return { ok: true };
});
