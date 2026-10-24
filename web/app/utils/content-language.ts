import type { InjectionKey, Ref } from 'vue';
import { DEFAULT_CONTENT_LOCALE, type ContentLocale, type LocalizedText } from '~~/shared/contracts/content';

export interface ContentLanguage {
  /** The language the specification is read in, following the UI language when it is set up. */
  primary: ContentLocale;
  /** Another content language shown under each text, for translators and reviewers; null for none. */
  secondary: ContentLocale | null;
}

/** Provided by the layout; components fall back to Vietnamese only when rendered on their own. */
export const CONTENT_LANGUAGE_KEY: InjectionKey<Ref<ContentLanguage>> = Symbol('content-language');

export const DEFAULT_CONTENT_VIEW: ContentLanguage = { primary: DEFAULT_CONTENT_LOCALE, secondary: null };

/**
 * The text in the wanted language. A missing translation falls back to Vietnamese, then to any written
 * language, so a text never renders blank just because it is not translated yet.
 */
export function resolveLocalizedText(text: LocalizedText, locale: ContentLocale): { value: string; locale: ContentLocale; isFallback: boolean } {
  const wanted = text[locale]?.trim();

  if (wanted) {
    return { value: wanted, locale, isFallback: false };
  }

  const fallback = [DEFAULT_CONTENT_LOCALE, ...Object.keys(text)].find((code) => text[code]?.trim()) ?? DEFAULT_CONTENT_LOCALE;

  return { value: text[fallback]?.trim() ?? '', locale: fallback, isFallback: true };
}

/** Every written translation, for searches that should match whichever language someone types in. */
export function localizedValues(text: LocalizedText): string[] {
  return Object.values(text).filter((value): value is string => Boolean(value?.trim()));
}

/**
 * Interface language names are shown in their own language so a reader can always find theirs; they
 * are identical in every locale and therefore not translation messages.
 */
export const LANGUAGE_AUTONYMS: Record<'vi' | 'ja' | 'en', string> = {
  vi: 'Tiếng Việt',
  ja: '日本語',
  en: 'English',
};
