import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { planStagesSchema } from '~~/server/utils/plan-schemas';

const MAX_BODY_BYTES = 16 * 1_024;

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { stages } = await readValidatedJsonBody(event, planStagesSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)('/admin/settings/stage-template', {
    method: 'PUT',
    body: { stages: stages.map(({ name, color }) => ({ name, color })) },
  });

  return { ok: true };
});
