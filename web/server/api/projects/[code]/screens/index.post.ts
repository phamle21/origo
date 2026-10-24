import { createAppError } from '~~/server/exceptions/app-error';
import { CAPTURE_TIMEOUT_MILLISECONDS, createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { createdScreenDtoSchema } from '~~/server/integrations/origo-api/dto/screen-map.dto';
import { readScreenUpload, toApiFormData } from '~~/server/utils/read-screen-upload';
import { projectParamsSchema } from '~~/server/utils/route-params';
import { collectLocalizedFields, screenTextsSchema } from '~~/server/utils/screen-editor-schemas';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';

export default defineApiHandler(async (event): Promise<{ code: string }> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));
  const { fields, source } = await readScreenUpload(event);
  const texts = screenTextsSchema.safeParse({
    name: collectLocalizedFields(fields, 'name'),
    flow: collectLocalizedFields(fields, 'flow'),
    purpose: collectLocalizedFields(fields, 'purpose'),
  });

  if (!texts.success || !source) {
    throw createAppError(API_ERROR_CODES.validationFailed, {
      fields: { ...(source ? {} : { source: ['required'] }), ...(texts.success ? {} : { name: ['invalid'] }) },
    });
  }

  const response = await createOrigoApiClient(event)(`/projects/${code}/screens`, {
    method: 'POST',
    body: toApiFormData(texts.data, source),
    timeout: CAPTURE_TIMEOUT_MILLISECONDS,
  });

  setResponseStatus(event, 201);

  return createdScreenDtoSchema.parse(response).data;
});
