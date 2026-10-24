import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { memberDtoSchema } from '~~/server/integrations/origo-api/dto/team.dto';
import { projectParamsSchema } from '~~/server/utils/route-params';
import { memberCreateSchema } from '~~/server/utils/team-schemas';
import type { ProjectMember } from '~~/shared/contracts/member';

const MAX_BODY_BYTES = 1_024;

export default defineApiHandler(async (event): Promise<ProjectMember> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));
  const body = await readValidatedJsonBody(event, memberCreateSchema, MAX_BODY_BYTES);

  setResponseStatus(event, 201);

  return memberDtoSchema.parse(await createOrigoApiClient(event)(`/projects/${code}/members`, { method: 'POST', body })).data;
});
