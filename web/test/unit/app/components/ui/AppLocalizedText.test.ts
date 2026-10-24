// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { ref } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import { CONTENT_LANGUAGE_KEY, type ContentLanguage } from '@/utils/content-language';

function mountWith(language: ContentLanguage, text: { vi: string | null; ja: string | null }) {
  return mountSuspended(AppLocalizedText, {
    props: { text },
    global: { provide: { [CONTENT_LANGUAGE_KEY as symbol]: ref(language) } },
  });
}

describe('AppLocalizedText', () => {
  test('shows only the primary language by default', async () => {
    const wrapper = await mountWith({ primary: 'ja', secondary: null }, { vi: 'Giá', ja: '価格' });

    expect(wrapper.text()).toBe('価格');
    expect(wrapper.find('[lang="ja"]').exists()).toBe(true);
  });

  test('adds the other language underneath in bilingual mode', async () => {
    const wrapper = await mountWith({ primary: 'vi', secondary: 'ja' }, { vi: 'Giá', ja: '価格' });

    expect(wrapper.find('[lang="vi"]').text()).toBe('Giá');
    expect(wrapper.find('[lang="ja"]').text()).toBe('価格');
  });

  test('falls back to the written language and marks it as not translated', async () => {
    const wrapper = await mountWith({ primary: 'ja', secondary: 'vi' }, { vi: 'Giá', ja: null });

    expect(wrapper.find('[lang="vi"]').text()).toBe('Giá');
    expect(wrapper.text()).toContain('Chưa dịch');
    expect(wrapper.findAll('[lang]')).toHaveLength(1);
  });

  test('marks the missing secondary language in bilingual mode', async () => {
    const wrapper = await mountWith({ primary: 'vi', secondary: 'ja' }, { vi: 'Giá', ja: '' });

    expect(wrapper.find('[lang="ja"]').text()).toContain('Chưa dịch');
  });
});
