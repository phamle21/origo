import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { memberDtoSchema } from '~~/server/integrations/origo-api/dto/team.dto';
import { projectCodeSchema, ulidSchema } from '~~/server/utils/route-params';
import { memberUpdateSchema } from '~~/server/utils/team-schemas';
import type { ProjectMember } from '~~/shared/contracts/member';

const MAX_BODY_BYTES = 1_024;
const paramsSchema = z.object({ code: projectCodeSchema, member: ulidSchema });

export default defineApiHandler(async (event): Promise<ProjectMember> => {
  const { code, member } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));
  const body = await readValidatedJsonBody(event, memberUpdateSchema, MAX_BODY_BYTES);

  return memberDtoSchema.parse(await createOrigoApiClient(event)(`/projects/${code}/members/${member.toLowerCase()}`, { method: 'PATCH', body })).data;
});
