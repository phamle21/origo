// @vitest-environment nuxt
import { afterEach, describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanStageTable from '@/components/plan/PlanStageTable.vue';
import { buildPlanRows } from '@/utils/plan-tree';
import type { PlanItem } from '~~/shared/contracts/plan';

const tree: PlanItem[] = [
  { id: 'phase', parentId: null, kind: 'phase', name: { vi: 'Phase 1' }, position: 1, note: null, screenCodes: [] },
  { id: 'module', parentId: 'phase', kind: 'module', name: { vi: 'Thanh toán' }, position: 1, note: null, screenCodes: [] },
  { id: 'a', parentId: 'module', kind: 'feature', name: { vi: 'Giỏ hàng' }, position: 1, note: null, screenCodes: [] },
  { id: 'b', parentId: 'module', kind: 'feature', name: { vi: 'Mã giảm giá' }, position: 2, note: null, screenCodes: [] },
];

async function mountTable(canEdit = true) {
  return mountSuspended(PlanStageTable, {
    props: { rows: buildPlanRows(tree, []), items: tree, stages: [], selectedItemId: null, language: 'vi', canEdit },
  });
}

function at<TValue>(list: TValue[], index: number): TValue {
  const value = list[index];

  if (value === undefined) {
    throw new Error(`Nothing at index ${index}`);
  }

  return value;
}

// jsdom has no DragEvent; a plain event with the drag names and a pointer position stands in.
async function drag(element: Element, type: string, clientY = 0) {
  element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientY }));
  await nextTick();
}

describe('PlanStageTable', () => {
  test('drags a feature below another with a dashed drop box in between', async () => {
    const wrapper = await mountTable();
    const rows = wrapper.findAll('tbody tr').map((row) => row.element);

    await drag(at(wrapper.findAll('button[draggable="true"]'), 2).element, 'dragstart');
    await drag(at(rows, 3), 'dragover', 50);

    const placeholder = wrapper.get('[data-drop-placeholder]');
    expect(placeholder.element.closest('tr')?.previousElementSibling).toBe(at(rows, 3));
    expect(placeholder.text()).toContain('Giỏ hàng');

    await drag(placeholder.element, 'drop');
    expect(wrapper.emitted('moveItem')).toEqual([['a', { parentId: 'module', index: 1 }]]);
    expect(wrapper.find('[data-drop-placeholder]').exists()).toBe(false);
  });

  test('moves with the arrow keys and hides the handle for readers', async () => {
    const wrapper = await mountTable();

    await wrapper.findAll('button[draggable="true"]')[3]?.trigger('keydown', { key: 'ArrowUp' });
    expect(wrapper.emitted('moveItemStep')).toEqual([['b', 'up']]);

    const reader = await mountTable(false);
    expect(reader.find('button[draggable="true"]').exists()).toBe(false);
  });
});

describe('PlanStageTable menus', () => {
  const task = { id: 'task', itemId: 'a', stageId: 'dev', startDate: '2026-10-05', endDate: '2026-10-09', status: 'doing', assigneeId: null } as const;
  const noted = tree.map((item) => (item.id === 'a' ? { ...item, note: 'Hỏi lại khách' } : item));

  async function mountWithTask(canEdit = true) {
    return mountSuspended(PlanStageTable, {
      props: {
        rows: buildPlanRows(noted, [task]),
        items: noted,
        stages: [{ id: 'dev', key: 'development', name: { vi: 'Phát triển' }, color: '#0f766e' }],
        selectedItemId: null,
        language: 'vi',
        canEdit,
      },
      attachTo: document.body,
    });
  }

  afterEach(() => document.body.querySelectorAll('[role="menu"], [role="tooltip"]').forEach((node) => node.remove()));

  test('right click on a stage cell changes its status or removes it', async () => {
    const wrapper = await mountWithTask();

    await wrapper.get('button[aria-label^="Phát triển"]').trigger('contextmenu');
    const done = [...document.body.querySelectorAll<HTMLElement>('[role="menuitemradio"]')].find((item) => item.textContent?.includes('Xong'));
    done?.click();
    await flushPromises();
    expect(wrapper.emitted('changeTaskStatus')).toEqual([[task, 'done']]);

    await wrapper.get('button[aria-label^="Phát triển"]').trigger('contextmenu');
    [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].at(-1)?.click();
    await flushPromises();
    expect(wrapper.emitted('removeTask')).toEqual([[task]]);
    wrapper.unmount();
  });

  test('right click on a row offers the same actions as the chart', async () => {
    const wrapper = await mountWithTask();

    await wrapper.findAll('tbody tr')[1]?.trigger('contextmenu');
    const labels = [...document.body.querySelectorAll('[role="menuitem"]')].map((item) => item.textContent?.trim());
    expect(labels).toContain('Thêm tính năng');
    [...document.body.querySelectorAll<HTMLElement>('[role="menuitem"]')].at(-1)?.click();
    await flushPromises();
    expect(wrapper.emitted('rowAction')).toEqual([['module', 'delete']]);
    wrapper.unmount();
  });

  test('shows the note button and opens the note', async () => {
    const wrapper = await mountWithTask(false);

    await wrapper.get('button[aria-label*="Giỏ hàng"].bg-info-soft').trigger('click');
    expect(wrapper.emitted('openNote')).toEqual([['a']]);
    wrapper.unmount();
  });
});
