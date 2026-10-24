import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { systemRoleDtoSchema } from '~~/server/integrations/origo-api/dto/access.dto';
import { ulidSchema } from '~~/server/utils/route-params';
import { systemRoleSchema } from '~~/server/utils/team-schemas';
import type { SystemRole } from '~~/shared/contracts/access';

const MAX_BODY_BYTES = 4 * 1_024;
const paramsSchema = z.object({ role: ulidSchema });

export default defineApiHandler(async (event): Promise<SystemRole> => {
  const { role } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, systemRoleSchema, MAX_BODY_BYTES);

  return systemRoleDtoSchema.parse(await createOrigoApiClient(event)(`/admin/system-roles/${role.toLowerCase()}`, { method: 'PATCH', body })).data;
});
