import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { contentLanguageListDtoSchema } from '~~/server/integrations/origo-api/dto/content-language.dto';
import type { ContentLanguageOption } from '~~/shared/contracts/content';

export default defineApiHandler(async (event): Promise<ContentLanguageOption[]> => {
  return contentLanguageListDtoSchema.parse(await createOrigoApiClient(event)('/admin/settings/content-languages')).data;
});
