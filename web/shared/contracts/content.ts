/** The default content language: always set up, always first, and the one the team writes first. */
export const DEFAULT_CONTENT_LOCALE = 'vi';

/** Language codes such as `vi`, `ja`, `en` or `zh-tw`; the same rule the API applies. */
export const CONTENT_LOCALE_PATTERN = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/;

/** At most this many content languages can be set up. */
export const MAX_CONTENT_LANGUAGES = 20;

/**
 * A language the specification is written in. Admins add them at runtime (Settings → Languages), so a
 * locale is any configured code. The interface language is a separate, fixed concern.
 */
export type ContentLocale = string;

/**
 * Specification text keyed by content language; null where a translation has not been written yet.
 * Vietnamese is always present. Keys of switched-off languages are kept untouched so nothing is lost.
 */
export type LocalizedText = { vi: string | null; [locale: string]: string | null };

export interface ContentLanguageOption {
  code: string;
  /** The language's own name, e.g. "Tiếng Việt", "日本語". */
  name: string;
  isActive: boolean;
  isDefault: boolean;
}
