import type { ContentLanguage } from '@/utils/content-language';
import { DEFAULT_CONTENT_LOCALE } from '~~/shared/contracts/content';

/**
 * Which content language to read in: the UI language when it is a set-up content language, otherwise
 * Vietnamese. A second language to show alongside is the reader's choice, kept in a cookie.
 */
export function useContentLanguage() {
  const { locale } = useI18n();
  const languages = useContentLanguages();
  const secondaryCookie = useCookie<string>('origo-secondary-language', { default: () => '', sameSite: 'lax', maxAge: 31_536_000 });

  const contentLanguage = computed<ContentLanguage>(() => {
    const codes = languages.value.map((language) => language.code);
    const primary = codes.includes(locale.value) ? locale.value : DEFAULT_CONTENT_LOCALE;
    const secondary = secondaryCookie.value && secondaryCookie.value !== primary && codes.includes(secondaryCookie.value) ? secondaryCookie.value : null;

    return { primary, secondary };
  });

  const secondaryLanguage = computed<string>({
    get: () => contentLanguage.value.secondary ?? '',
    set: (code) => {
      secondaryCookie.value = code;
    },
  });

  return { contentLanguage, secondaryLanguage };
}
