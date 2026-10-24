import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { permissionDtoSchema } from '~~/server/integrations/origo-api/dto/access.dto';
import { ulidSchema } from '~~/server/utils/route-params';
import { permissionUpdateSchema } from '~~/server/utils/team-schemas';
import { PERMISSION_SCOPES, type PermissionEntry } from '~~/shared/contracts/access';

const MAX_BODY_BYTES = 4 * 1_024;
const paramsSchema = z.object({ scope: z.enum(PERMISSION_SCOPES), permission: ulidSchema });

export default defineApiHandler(async (event): Promise<PermissionEntry> => {
  const { scope, permission } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, permissionUpdateSchema(scope), MAX_BODY_BYTES);

  return permissionDtoSchema.parse(await createOrigoApiClient(event)(`/admin/permissions/${scope}/${permission.toLowerCase()}`, { method: 'PATCH', body }))
    .data;
});
