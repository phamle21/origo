import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { conceptCreatedDtoSchema } from '~~/server/integrations/origo-api/dto/screen-map.dto';
import { projectParamsSchema } from '~~/server/utils/route-params';
import { conceptPayloadSchema } from '~~/server/utils/screen-editor-schemas';
import type { BusinessConcept } from '~~/shared/contracts/screen';

const MAX_BODY_BYTES = 8 * 1_024;

export default defineApiHandler(async (event): Promise<BusinessConcept> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));
  const body = await readValidatedJsonBody(event, conceptPayloadSchema, MAX_BODY_BYTES);
  const response = await createOrigoApiClient(event)(`/projects/${code}/concepts`, { method: 'POST', body });

  setResponseStatus(event, 201);

  return conceptCreatedDtoSchema.parse(response).data;
});
