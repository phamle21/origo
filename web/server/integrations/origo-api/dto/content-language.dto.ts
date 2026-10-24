import { z } from 'zod';

const contentLanguageSchema = z.object({ code: z.string(), name: z.string(), isActive: z.boolean(), isDefault: z.boolean() });

export const contentLanguageListDtoSchema = z.object({ data: z.array(contentLanguageSchema) });
