import { fetchContentLanguages } from '@/api/content/content';
import { DEFAULT_CONTENT_LOCALE, type ContentLanguageOption } from '~~/shared/contracts/content';

const FALLBACK: ContentLanguageOption[] = [{ code: DEFAULT_CONTENT_LOCALE, name: 'Tiếng Việt', isActive: true, isDefault: true }];

/**
 * The active content languages, in order (Vietnamese first). Loaded once per visit by the auth
 * middleware and shared through hydration; every localized field shows one box per language here.
 */
export function useContentLanguages() {
  const languages = useState<ContentLanguageOption[]>('content-languages', () => []);

  return computed(() => (languages.value.length ? languages.value : FALLBACK));
}

/** Loads (or, after admins change them, reloads) the active content languages. */
export async function loadContentLanguages(): Promise<void> {
  const languages = useState<ContentLanguageOption[]>('content-languages', () => []);

  languages.value = await fetchContentLanguages().catch(() => languages.value);
}
