import { z } from 'zod';
import type { LocalizedText } from '~~/shared/contracts/content';

const nullableText = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

/** Any configured content languages; Vietnamese is always present in what the web receives. */
export const localizedTextDtoSchema = z
  .record(z.string(), nullableText)
  .nullish()
  .transform((value): LocalizedText => ({ vi: null, ...(value ?? {}) }));
