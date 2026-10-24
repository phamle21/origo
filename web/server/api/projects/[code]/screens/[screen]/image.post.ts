import { z } from 'zod';
import { createAppError } from '~~/server/exceptions/app-error';
import { CAPTURE_TIMEOUT_MILLISECONDS, createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { readScreenUpload, toApiFormData } from '~~/server/utils/read-screen-upload';
import { projectCodeSchema, screenCodeSchema } from '~~/server/utils/route-params';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';

const paramsSchema = z.object({ code: projectCodeSchema, screen: screenCodeSchema });

export default defineApiHandler(async (event): Promise<{ ok: true }> => {
  const { code, screen } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const { source } = await readScreenUpload(event);

  if (!source) {
    throw createAppError(API_ERROR_CODES.validationFailed, { fields: { source: ['required'] } });
  }

  await createOrigoApiClient(event)(`/projects/${code}/screens/${screen}/image`, {
    method: 'POST',
    body: toApiFormData({}, source),
    timeout: CAPTURE_TIMEOUT_MILLISECONDS,
  });

  return { ok: true };
});
