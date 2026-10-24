import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectRoleDtoSchema } from '~~/server/integrations/origo-api/dto/access.dto';
import { projectRoleSchema } from '~~/server/utils/team-schemas';
import type { ProjectRoleOption } from '~~/shared/contracts/access';

const MAX_BODY_BYTES = 4 * 1_024;

export default defineApiHandler(async (event): Promise<ProjectRoleOption> => {
  const body = await readValidatedJsonBody(event, projectRoleSchema, MAX_BODY_BYTES);

  setResponseStatus(event, 201);

  return projectRoleDtoSchema.parse(await createOrigoApiClient(event)('/admin/project-roles', { method: 'POST', body })).data;
});
