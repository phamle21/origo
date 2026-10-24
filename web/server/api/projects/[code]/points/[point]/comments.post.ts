import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { commentCreatedDtoSchema } from '~~/server/integrations/origo-api/dto/screen-map.dto';
import { pointIdSchema, projectCodeSchema } from '~~/server/utils/route-params';
import { commentPayloadSchema } from '~~/server/utils/screen-editor-schemas';
import type { PointComment } from '~~/shared/contracts/screen';

const MAX_BODY_BYTES = 8 * 1_024;
const paramsSchema = z.object({ code: projectCodeSchema, point: pointIdSchema });

export default defineApiHandler(async (event): Promise<PointComment> => {
  const { point } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, commentPayloadSchema, MAX_BODY_BYTES);
  const response = await createOrigoApiClient(event)(`/points/${point.toLowerCase()}/comments`, { method: 'POST', body });

  setResponseStatus(event, 201);

  return commentCreatedDtoSchema.parse(response).data;
});
