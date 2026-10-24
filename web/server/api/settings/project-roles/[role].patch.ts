import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectRoleDtoSchema } from '~~/server/integrations/origo-api/dto/access.dto';
import { ulidSchema } from '~~/server/utils/route-params';
import { projectRoleSchema } from '~~/server/utils/team-schemas';
import type { ProjectRoleOption } from '~~/shared/contracts/access';

const MAX_BODY_BYTES = 4 * 1_024;
const paramsSchema = z.object({ role: ulidSchema });

export default defineApiHandler(async (event): Promise<ProjectRoleOption> => {
  const { role } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, projectRoleSchema, MAX_BODY_BYTES);

  return projectRoleDtoSchema.parse(await createOrigoApiClient(event)(`/admin/project-roles/${role.toLowerCase()}`, { method: 'PATCH', body })).data;
});
