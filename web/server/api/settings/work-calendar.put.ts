import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { workCalendarSchema } from '~~/server/utils/plan-schemas';

const MAX_BODY_BYTES = 128 * 1_024;

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const body = await readValidatedJsonBody(event, workCalendarSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)('/admin/settings/work-calendar', { method: 'PUT', body });

  return { ok: true };
});
