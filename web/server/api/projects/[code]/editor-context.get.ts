import { fetchProjectRecord } from '~~/server/repositories/project/project';
import { buildEditorContext } from '~~/server/services/screen/screen';
import { projectParamsSchema } from '~~/server/utils/route-params';
import type { ScreenEditorContext } from '~~/shared/contracts/screen-editor';

export default defineApiHandler(async (event): Promise<ScreenEditorContext> => {
  const { code } = await getValidatedRouterParams(event, (value) => projectParamsSchema.parse(value));

  return buildEditorContext(await fetchProjectRecord(event, code));
});
