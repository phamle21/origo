// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import EditorPointList from '@/components/editor/EditorPointList.vue';

const props = {
  points: [
    { key: 'a', title: 'Giá' },
    { key: 'b', title: '' },
  ],
  selectedKey: 'a',
};

describe('EditorPointList', () => {
  test('numbers points in order and marks untitled ones', async () => {
    const wrapper = await mountSuspended(EditorPointList, { props });

    expect(wrapper.findAll('li').map((item) => item.text())).toEqual([expect.stringContaining('1Giá'), expect.stringContaining('2Chưa đặt tên')]);
  });

  test('disables moving past either end', async () => {
    const wrapper = await mountSuspended(EditorPointList, { props });

    expect(wrapper.get('[aria-label="Đưa điểm 1 lên"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="Đưa điểm 2 xuống"]').attributes('disabled')).toBeDefined();
  });

  test('emits select, move and remove', async () => {
    const wrapper = await mountSuspended(EditorPointList, { props });

    await wrapper.findAll('[aria-pressed]')[1]?.trigger('click');
    await wrapper.get('[aria-label="Đưa điểm 1 xuống"]').trigger('click');
    await wrapper.get('[aria-label="Xóa điểm 2"]').trigger('click');

    expect(wrapper.emitted('select')).toEqual([['b']]);
    expect(wrapper.emitted('move')).toEqual([[0, 1]]);
    expect(wrapper.emitted('remove')).toEqual([['b']]);
  });

  test('explains how to start when there are no points', async () => {
    const wrapper = await mountSuspended(EditorPointList, { props: { points: [], selectedKey: null } });

    expect(wrapper.text()).toContain('Chưa có điểm nào');
  });
});
