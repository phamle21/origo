// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ScreenMapViewer from '@/components/screen/ScreenMapViewer.vue';

const props = {
  image: { src: '/images/screens/cart.svg', width: 1_200, height: 760 },
  imageAlt: 'Cart',
  points: [
    { number: 1, title: { vi: 'Dòng giỏ hàng', ja: 'カート行' }, box: [3.5, 16, 58, 26] as [number, number, number, number] },
    { number: 2, title: { vi: 'Mã giảm giá', ja: null }, box: [65, 16, 31.5, 20] as [number, number, number, number] },
  ],
  selectedNumber: 2,
};

describe('ScreenMapViewer', () => {
  test('places one labelled button per point, positioned in percent of the image', async () => {
    const wrapper = await mountSuspended(ScreenMapViewer, { props });
    const buttons = wrapper.findAll('button');

    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.attributes('aria-label')).toBe('Điểm 1: Dòng giỏ hàng');
    expect(buttons[0]?.attributes('style')).toContain('left: 3.5%');
    expect(buttons[1]?.attributes('aria-pressed')).toBe('true');
  });

  test('emits the number of the point the reader selects', async () => {
    const wrapper = await mountSuspended(ScreenMapViewer, { props });

    await wrapper.findAll('button')[0]?.trigger('click');

    expect(wrapper.emitted('select')).toEqual([[1]]);
  });
});
