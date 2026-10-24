// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ScreenSwitcher from '@/components/screen/ScreenSwitcher.vue';
import { chooseOption, openSelect, optionLabels, selectedLabel } from '../../../helpers/app-select';

const props = {
  screens: [
    { code: 'SC-01', name: { vi: 'Chi tiết khóa học', ja: 'コース詳細' } },
    { code: 'SC-02', name: { vi: 'Giỏ hàng', ja: null } },
  ],
  currentCode: 'SC-02',
  label: 'Màn hình',
};

describe('ScreenSwitcher', () => {
  test('lists every screen and marks the current one as selected', async () => {
    const wrapper = await mountSuspended(ScreenSwitcher, { props });
    expect(selectedLabel(wrapper)).toBe('Giỏ hàng');
    await openSelect(wrapper);
    expect(optionLabels(wrapper)).toEqual(['Chi tiết khóa học', 'Giỏ hàng']);
    expect(wrapper.get('[role="option"][aria-selected="true"]').text()).toContain('Giỏ hàng');
  });

  test('emits the chosen screen code', async () => {
    const wrapper = await mountSuspended(ScreenSwitcher, { props });

    await chooseOption(wrapper, 'Chi tiết khóa học');

    expect(wrapper.emitted('change')).toEqual([['SC-01']]);
  });
});
