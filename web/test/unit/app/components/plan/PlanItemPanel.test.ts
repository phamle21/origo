// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanItemPanel from '@/components/plan/PlanItemPanel.vue';
import type { PlanItem } from '~~/shared/contracts/plan';

const feature: PlanItem = { id: 'f', parentId: 'm', kind: 'feature', name: { vi: 'Giỏ hàng' }, note: 'Chờ giá.', position: 1, screenCodes: [] };

function mountPanel(canEdit: boolean, item: PlanItem = feature) {
  return mountSuspended(PlanItemPanel, {
    props: {
      projectCode: 'LMS',
      item,
      stages: [],
      tasks: [],
      members: [],
      screens: [],
      canEdit,
      language: 'vi',
      path: [{ vi: 'Phase 1' }, { vi: 'Thanh toán' }],
    },
  });
}

describe('PlanItemPanel notes', () => {
  test('saves an edited note and reports unsaved typing', async () => {
    const wrapper = await mountPanel(true);
    const note = wrapper.get('textarea');

    expect((note.element as HTMLTextAreaElement).value).toBe('Chờ giá.');
    await note.setValue('  Chờ giá và mã giảm giá.  ');
    expect(wrapper.emitted('update:isNoteDirty')?.at(-1)).toEqual([true]);

    await note.element.closest('form')?.dispatchEvent(new Event('submit'));
    expect(wrapper.emitted('saveNote')).toEqual([['Chờ giá và mã giảm giá.']]);
  });

  test('clearing the note saves "no note", and readers only read it', async () => {
    const wrapper = await mountPanel(true);

    await wrapper.get('textarea').setValue('   ');
    wrapper.get('textarea').element.closest('form')?.dispatchEvent(new Event('submit'));
    expect(wrapper.emitted('saveNote')).toEqual([[null]]);

    const reader = await mountPanel(false);
    expect(reader.find('textarea').exists()).toBe(false);
    expect(reader.text()).toContain('Chờ giá.');
    expect(reader.text()).toContain('Thanh toán');
  });
});

describe('PlanItemPanel one-stage view', () => {
  const stages = [
    { id: 'bd', key: 'basic', name: { vi: 'Thiết kế cơ bản' }, color: '#7c3aed' },
    { id: 'dev', key: 'dev', name: { vi: 'Phát triển' }, color: '#0f766e' },
  ];
  const tasks = [{ id: 't', itemId: 'f', stageId: 'dev', startDate: '2026-11-02', endDate: '2026-11-06', status: 'doing' as const, assigneeId: null }];

  function mountFocused(focusStageId: string | null) {
    return mountSuspended(PlanItemPanel, {
      props: { projectCode: 'LMS', item: feature, stages, tasks, members: [], screens: [], canEdit: true, language: 'vi', focusStageId },
    });
  }

  test('a clicked stage shows only that stage, open for editing, with a way back to everything', async () => {
    const wrapper = await mountFocused('dev');

    expect(wrapper.text()).toContain('Phát triển');
    expect(wrapper.text()).not.toContain('Thiết kế cơ bản');
    expect(wrapper.find('form input[type="date"]').exists()).toBe(true);

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Xem toàn bộ việc'))
      ?.trigger('click');
    expect(wrapper.emitted('showAll')).toHaveLength(1);
  });

  test('without a focused stage every stage is listed', async () => {
    const wrapper = await mountFocused(null);

    expect(wrapper.text()).toContain('Thiết kế cơ bản');
    expect(wrapper.text()).toContain('Phát triển');
    expect(wrapper.text()).not.toContain('Xem toàn bộ việc');
  });
});
