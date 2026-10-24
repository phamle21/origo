import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { memberListDtoSchema } from '~~/server/integrations/origo-api/dto/team.dto';
import { projectParamsSchema } from '~~/server/utils/route-params';
import type { ProjectMember } from '~~/shared/contracts/member';

export default defineApiHandler(async (event): Promise<ProjectMember[]> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));

  return memberListDtoSchema.parse(await createOrigoApiClient(event)(`/projects/${code}/members`)).data;
});
