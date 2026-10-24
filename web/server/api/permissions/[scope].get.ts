import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { permissionListDtoSchema } from '~~/server/integrations/origo-api/dto/access.dto';
import { PERMISSION_SCOPES, type PermissionEntry } from '~~/shared/contracts/access';

const paramsSchema = z.object({ scope: z.enum(PERMISSION_SCOPES) });

export default defineApiHandler(async (event): Promise<PermissionEntry[]> => {
  const { scope } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));

  return permissionListDtoSchema.parse(await createOrigoApiClient(event)(`/permissions/${scope}`)).data;
});
