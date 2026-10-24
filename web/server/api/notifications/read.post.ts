import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';

const MAX_BODY_BYTES = 8 * 1_024;
// No ids means "mark everything read".
const bodySchema = z.object({ ids: z.array(z.uuid()).max(100).optional() });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const body = await readValidatedJsonBody(event, bodySchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)('/notifications/read', { method: 'POST', body });

  return { ok: true };
});
