import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  await createOrigoApiClient(event)('/admin/settings/plan-template', { method: 'DELETE' });

  return { ok: true };
});
