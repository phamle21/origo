// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ScreenPointList from '@/components/screen/ScreenPointList.vue';

const props = {
  points: [
    { number: 1, title: { vi: 'Dòng giỏ hàng', ja: 'カート行' } },
    { number: 2, title: { vi: 'Mã giảm giá', ja: null } },
  ],
  selectedNumber: 2,
  label: 'Các số trên màn hình này',
};

describe('ScreenPointList', () => {
  test('renders one labelled chip per point and marks the selected one', async () => {
    const wrapper = await mountSuspended(ScreenPointList, { props });
    const chips = wrapper.findAll('button');

    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('Các số trên màn hình này');
    expect(chips.map((chip) => [chip.text(), chip.attributes('aria-pressed')])).toEqual([
      ['1Dòng giỏ hàng', 'false'],
      ['2Mã giảm giá', 'true'],
    ]);
  });

  test('emits the number of the chosen point', async () => {
    const wrapper = await mountSuspended(ScreenPointList, { props });

    await wrapper.findAll('button')[0]?.trigger('click');

    expect(wrapper.emitted('select')).toEqual([[1]]);
  });
});
