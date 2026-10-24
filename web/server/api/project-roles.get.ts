import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectRoleListDtoSchema } from '~~/server/integrations/origo-api/dto/access.dto';
import type { ProjectRoleOption } from '~~/shared/contracts/access';

// Every signed-in person reads the project roles: their names appear on members, plans and badges.
export default defineApiHandler(async (event): Promise<ProjectRoleOption[]> => {
  return projectRoleListDtoSchema.parse(await createOrigoApiClient(event)('/project-roles')).data;
});
