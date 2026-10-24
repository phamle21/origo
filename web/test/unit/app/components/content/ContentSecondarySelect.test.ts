// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ContentSecondarySelect from '@/components/content/ContentSecondarySelect.vue';
import { chooseOption, openSelect, optionLabels } from '../../../helpers/app-select';

const languages = [
  { code: 'vi', name: 'Tiếng Việt', isActive: true, isDefault: true },
  { code: 'ja', name: '日本語', isActive: true, isDefault: false },
  { code: 'en', name: 'English', isActive: true, isDefault: false },
];

describe('ContentSecondarySelect', () => {
  test('offers every language except the one being read, plus "none"', async () => {
    const wrapper = await mountSuspended(ContentSecondarySelect, { props: { modelValue: '', languages, primary: 'ja' } });

    await openSelect(wrapper);
    expect(optionLabels(wrapper)).toEqual([expect.any(String), 'Tiếng Việt', 'English']);
    await chooseOption(wrapper, 'English');
    expect(wrapper.emitted('update:modelValue')).toEqual([['en']]);
  });
});
