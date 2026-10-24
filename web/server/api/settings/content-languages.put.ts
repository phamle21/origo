import { z } from 'zod';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { contentLanguageListDtoSchema } from '~~/server/integrations/origo-api/dto/content-language.dto';
import { CONTENT_LOCALE_PATTERN, MAX_CONTENT_LANGUAGES, type ContentLanguageOption } from '~~/shared/contracts/content';

const MAX_BODY_BYTES = 8 * 1_024;
const bodySchema = z.object({
  languages: z
    .array(z.object({ code: z.string().regex(CONTENT_LOCALE_PATTERN), name: z.string().trim().min(1).max(60), isActive: z.boolean() }))
    .min(1)
    .max(MAX_CONTENT_LANGUAGES)
    .refine((languages) => new Set(languages.map((language) => language.code)).size === languages.length, { message: 'duplicate' }),
});

export default defineApiHandler(async (event): Promise<ContentLanguageOption[]> => {
  const body = await readValidatedJsonBody(event, bodySchema, MAX_BODY_BYTES);

  return contentLanguageListDtoSchema.parse(await createOrigoApiClient(event)('/admin/settings/content-languages', { method: 'PUT', body })).data;
});
