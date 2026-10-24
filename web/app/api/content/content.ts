import { useApiClient } from '@/api/client';
import type { ContentLanguageOption } from '~~/shared/contracts/content';
import type { TranslationRequest, TranslationResult } from '~~/shared/contracts/translation';

export function fetchContentLanguages(): Promise<ContentLanguageOption[]> {
  return useApiClient()<ContentLanguageOption[]>('/api/content-languages');
}

export function fetchAllContentLanguages(): Promise<ContentLanguageOption[]> {
  return useApiClient()<ContentLanguageOption[]>('/api/settings/content-languages');
}

export function saveContentLanguages(languages: Pick<ContentLanguageOption, 'code' | 'name' | 'isActive'>[]): Promise<ContentLanguageOption[]> {
  return useApiClient()<ContentLanguageOption[]>('/api/settings/content-languages', { method: 'PUT', body: { languages } });
}

export function translateContent(request: TranslationRequest): Promise<TranslationResult> {
  return useApiClient()<TranslationResult>('/api/translate', { method: 'POST', body: request });
}
