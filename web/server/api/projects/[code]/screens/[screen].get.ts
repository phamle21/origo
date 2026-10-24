import { z } from 'zod';
import { fetchProjectRecord } from '~~/server/repositories/project/project';
import { buildScreenDetail } from '~~/server/services/screen/screen';
import { projectCodeSchema, screenCodeSchema } from '~~/server/utils/route-params';
import type { ScreenDetail } from '~~/shared/contracts/screen';

const paramsSchema = z.object({ code: projectCodeSchema, screen: screenCodeSchema });

export default defineApiHandler(async (event): Promise<ScreenDetail> => {
  const { code, screen } = await getValidatedRouterParams(event, (value) => paramsSchema.parse(value));

  return buildScreenDetail(await fetchProjectRecord(event, code), screen);
});
