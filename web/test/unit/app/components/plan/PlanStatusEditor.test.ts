// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanStatusEditor from '@/components/plan/PlanStatusEditor.vue';
import type { PlanStatus } from '~~/shared/contracts/plan';

const statuses: PlanStatus[] = [
  { id: 'todo', name: { vi: 'Chưa làm' }, category: 'todo', color: '#94a3b8' },
  { id: 'doing', name: { vi: 'Đang làm' }, category: 'doing', color: '#2563eb' },
  { id: 'done', name: { vi: 'Xong' }, category: 'done', color: '#16a34a' },
];

describe('PlanStatusEditor', () => {
  test('keeps one status per group: the last one of a group cannot be removed', async () => {
    const wrapper = await mountSuspended(PlanStatusEditor, { props: { statuses, formId: 'f' } });

    const removeButtons = wrapper.findAll('button[aria-label^="Bỏ"]');
    expect(removeButtons).toHaveLength(3);
    expect(removeButtons.every((button) => button.attributes('disabled') !== undefined)).toBe(true);
  });

  test('adds a named status and saves the whole ordered list', async () => {
    const wrapper = await mountSuspended(PlanStatusEditor, { props: { statuses, formId: 'f' } });

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Thêm trạng thái'))
      ?.trigger('click');
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs.at(-1)?.setValue('Đang kiểm tra');
    await wrapper.get('form').trigger('submit');

    const saved = wrapper.emitted('save')?.[0]?.[0] as { name: { vi: string }; category: string; id: string | null }[];
    expect(saved).toHaveLength(4);
    expect(saved.at(-1)).toMatchObject({ id: null, category: 'doing', name: { vi: 'Đang kiểm tra' } });
  });
});
