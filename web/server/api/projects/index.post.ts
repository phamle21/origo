import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectCreateSchema } from '~~/server/utils/team-schemas';

const MAX_BODY_BYTES = 16 * 1_024;

export default defineApiHandler(async (event): Promise<{ code: string }> => {
  const body = await readValidatedJsonBody(event, projectCreateSchema, MAX_BODY_BYTES);

  await createOrigoApiClient(event)('/projects', { method: 'POST', body });
  setResponseStatus(event, 201);

  return { code: body.code };
});
