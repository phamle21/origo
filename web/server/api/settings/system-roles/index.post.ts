import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { systemRoleDtoSchema } from '~~/server/integrations/origo-api/dto/access.dto';
import { systemRoleSchema } from '~~/server/utils/team-schemas';
import type { SystemRole } from '~~/shared/contracts/access';

const MAX_BODY_BYTES = 4 * 1_024;

export default defineApiHandler(async (event): Promise<SystemRole> => {
  const body = await readValidatedJsonBody(event, systemRoleSchema, MAX_BODY_BYTES);

  setResponseStatus(event, 201);

  return systemRoleDtoSchema.parse(await createOrigoApiClient(event)('/admin/system-roles', { method: 'POST', body })).data;
});
