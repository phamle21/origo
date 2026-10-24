import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { systemRoleListDtoSchema } from '~~/server/integrations/origo-api/dto/access.dto';
import type { SystemRole } from '~~/shared/contracts/access';

export default defineApiHandler(async (event): Promise<SystemRole[]> => {
  return systemRoleListDtoSchema.parse(await createOrigoApiClient(event)('/admin/system-roles')).data;
});
