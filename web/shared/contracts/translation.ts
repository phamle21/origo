import type { ContentLocale } from './content';

export const MAX_TRANSLATION_CHARACTERS = 2_000;
export const MAX_TRANSLATION_TARGETS = 10;

export interface TranslationRequest {
  text: string;
  from: ContentLocale;
  to: ContentLocale[];
}

/** One entry per requested language; null when that language could not be translated. */
export interface TranslationResult {
  translations: Record<ContentLocale, string | null>;
}
