import { fetchProjectRecord } from '~~/server/repositories/project/project';
import { buildProjectScreens } from '~~/server/services/screen/screen';
import { projectParamsSchema } from '~~/server/utils/route-params';
import type { ProjectScreens } from '~~/shared/contracts/screen';

export default defineApiHandler(async (event): Promise<ProjectScreens> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));

  return buildProjectScreens(await fetchProjectRecord(event, code));
});
