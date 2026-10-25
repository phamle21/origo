// @vitest-environment nuxt
import { afterEach, describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanGantt from '@/components/plan/PlanGantt.vue';
import { toDayNumber } from '@/utils/plan-dates';
import { buildPlanRows } from '@/utils/plan-tree';
import type { PlanItem, PlanTask } from '~~/shared/contracts/plan';

const DAY_WIDTH = 20;
const items: PlanItem[] = [
  { id: 'phase', parentId: null, kind: 'phase', name: { vi: 'Phase 1', ja: null }, position: 0, note: null, priority: null, screenCodes: [] },
  { id: 'feature', parentId: 'phase', kind: 'feature', name: { vi: 'Đăng nhập', ja: null }, position: 0, note: null, priority: null, screenCodes: [] },
];
const task: PlanTask = {
  id: 'task',
  itemId: 'feature',
  stageId: 'dev',
  startDate: '2026-10-05',
  endDate: '2026-10-09',
  status: 'doing',
  assigneeId: null,
  statusId: null,
  estimateDays: null,
  progress: null,
  link: null,
  note: null,
};

async function mountGantt(canEdit = true) {
  return mountSuspended(PlanGantt, {
    props: {
      rows: buildPlanRows(items, [task]),
      stages: [{ id: 'dev', key: 'development', name: { vi: 'Phát triển', ja: null }, color: '#0f766e', startDate: null, endDate: null, owner: null }],
      statuses: [
        { id: 's-todo', name: { vi: 'Chưa làm' }, category: 'todo' as const, color: '#94a3b8' },
        { id: 's-doing', name: { vi: 'Đang làm' }, category: 'doing' as const, color: '#2563eb' },
        { id: 's-done', name: { vi: 'Xong' }, category: 'done' as const, color: '#16a34a' },
      ],
      timeline: { start: toDayNumber('2026-10-01'), end: toDayNumber('2026-10-31') },
      dayWidth: DAY_WIDTH,
      today: null,
      canEdit,
      selectedItemId: null,
      language: 'vi',
    },
  });
}

// jsdom has no PointerEvent, so a MouseEvent with the pointer event names stands in.
async function pointer(element: Element, type: string, clientX: number) {
  element.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, clientX }));
  await nextTick();
}

describe('PlanGantt', () => {
  // Menus and tooltips are teleported to <body>; a failed test must not leave them for the next one.
  afterEach(() => document.body.querySelectorAll('[role="menu"], [role="tooltip"]').forEach((node) => node.remove()));

  test('moves a task by whole days when its bar is dragged', async () => {
    const wrapper = await mountGantt();
    const bar = wrapper.get('button[aria-label^="Phát triển"]');

    await pointer(bar.element, 'pointerdown', 100);
    await pointer(bar.element, 'pointermove', 100 + DAY_WIDTH * 2 + 4);
    await pointer(bar.element, 'pointerup', 100 + DAY_WIDTH * 2 + 4);

    expect(wrapper.emitted('moveTask')).toEqual([[task, { start: toDayNumber('2026-10-07'), end: toDayNumber('2026-10-11') }]]);
  });

  test('changes only the end date when the right edge is dragged', async () => {
    const wrapper = await mountGantt();
    const handle = wrapper.get('[data-handle="end"]');

    await pointer(handle.element, 'pointerdown', 100);
    await pointer(handle.element, 'pointermove', 100 - DAY_WIDTH * 2);
    await pointer(handle.element, 'pointerup', 100 - DAY_WIDTH * 2);

    expect(wrapper.emitted('moveTask')?.[0]?.[1]).toEqual({ start: toDayNumber('2026-10-05'), end: toDayNumber('2026-10-07') });
  });

  test('opens just the clicked stage on a click without a drag', async () => {
    const wrapper = await mountGantt();
    const bar = wrapper.get('button[aria-label^="Phát triển"]');

    await pointer(bar.element, 'pointerdown', 100);
    await pointer(bar.element, 'pointerup', 100);
    await bar.trigger('click');

    expect(wrapper.emitted('moveTask')).toBeUndefined();
    expect(wrapper.emitted('selectStage')).toEqual([['feature', 'dev']]);
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  test('moves with arrow keys and stretches with Shift', async () => {
    const wrapper = await mountGantt();
    const bar = wrapper.get('button[aria-label^="Phát triển"]');

    await bar.trigger('keydown', { key: 'ArrowLeft' });
    await bar.trigger('keydown', { key: 'ArrowRight', shiftKey: true });

    expect(wrapper.emitted('moveTask')?.map(([, range]) => range)).toEqual([
      { start: toDayNumber('2026-10-04'), end: toDayNumber('2026-10-08') },
      { start: toDayNumber('2026-10-05'), end: toDayNumber('2026-10-10') },
    ]);
  });

  test('never moves a bar for a reader without edit rights', async () => {
    const wrapper = await mountGantt(false);
    const bar = wrapper.get('button[aria-label^="Phát triển"]');

    await pointer(bar.element, 'pointerdown', 100);
    await pointer(bar.element, 'pointermove', 200);
    await pointer(bar.element, 'pointerup', 200);
    await bar.trigger('keydown', { key: 'ArrowRight' });

    expect(wrapper.emitted('moveTask')).toBeUndefined();
    expect(wrapper.find('[data-handle]').exists()).toBe(false);
  });

  test('shows the new dates while a bar is dragged', async () => {
    const wrapper = await mountGantt();
    const bar = wrapper.get('button[aria-label^="Phát triển"]');

    await pointer(bar.element, 'pointerdown', 100);
    await pointer(bar.element, 'pointermove', 100 + DAY_WIDTH);

    expect(wrapper.get('[role="status"]').text()).toContain('5');
    await pointer(bar.element, 'pointerup', 100 + DAY_WIDTH);
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  test('shades phase rows and tints the selected row', async () => {
    const wrapper = await mountGantt();

    expect(wrapper.find('.bg-group-strong').exists()).toBe(true);
    await wrapper.setProps({ selectedItemId: 'feature' });
    expect(wrapper.find('.bg-accent-soft').exists()).toBe(true);
  });

  test('collapses a phase from its toggle', async () => {
    const wrapper = await mountGantt();

    await wrapper.get('button[aria-expanded="true"]').trigger('click');

    expect(wrapper.emitted('toggle')).toEqual([['phase']]);
  });

  test('right-clicking a bar offers the statuses and reports the one picked', async () => {
    const wrapper = await mountGantt();
    const bar = wrapper.get('button[aria-label^="Phát triển"]');

    bar.element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 50, clientY: 50 }));
    await flushPromises();

    const menu = document.body.querySelector('[role="menu"]');
    const options = [...(menu?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])];

    expect(options.map((option) => option.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    options[2]?.click();
    await flushPromises();

    expect(wrapper.emitted('changeTaskStatus')).toEqual([[task, 's-done']]);
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
    wrapper.unmount();
  });

  test('opens the status menu from the keyboard, never for readers', async () => {
    const wrapper = await mountGantt();

    await wrapper.get('button[aria-label^="Phát triển"]').trigger('keydown', { key: 'F10', shiftKey: true });
    expect(document.body.querySelector('[role="menu"]')).not.toBeNull();
    document.body.querySelector<HTMLElement>('[role="menu"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
    wrapper.unmount();

    // A reader cannot change a status, so the click falls through to the row menu instead.
    const reader = await mountGantt(false);
    reader.get('button[aria-label^="Phát triển"]').element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    await flushPromises();
    expect(document.body.querySelector('[role="menuitemradio"]')).toBeNull();
    expect(document.body.querySelector('[role="menu"] [role="menuitem"]')?.textContent).toContain('Mở chi tiết');
    reader.unmount();
  });

  test('shows a feature note on its ⓘ button and opens it on click', async () => {
    const wrapper = await mountSuspended(PlanGantt, {
      props: {
        rows: buildPlanRows(
          [{ id: 'f', parentId: null, kind: 'feature', name: { vi: 'Đăng nhập' }, note: 'Chờ khách xác nhận.', position: 1, priority: null, screenCodes: [] }],
          [],
        ),
        stages: [],
        timeline: { start: toDayNumber('2026-10-01'), end: toDayNumber('2026-10-05') },
        dayWidth: DAY_WIDTH,
        today: null,
        canEdit: false,
        selectedItemId: null,
        language: 'vi',
      },
    });
    const info = wrapper.get('button[aria-describedby], button.rounded-full');

    await info.trigger('mouseenter');
    expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('Chờ khách xác nhận.');
    expect(info.attributes('aria-describedby')).toBe(document.body.querySelector('[role="tooltip"]')?.id);

    await info.trigger('click');
    expect(wrapper.emitted('openNote')).toEqual([['f']]);
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    wrapper.unmount();
  });

  test('right-clicking a row offers the item actions an editor may use', async () => {
    const wrapper = await mountGantt();
    const featureRow = wrapper.findAll('[data-row-label]')[1]?.element.parentElement;

    featureRow?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }));
    await flushPromises();

    const labels = [...document.body.querySelectorAll('[role="menu"] [role="menuitem"]')].map((item) => item.textContent?.trim());

    expect(labels).toHaveLength(5);
    document.body.querySelectorAll<HTMLButtonElement>('[role="menu"] [role="menuitem"]')[4]?.click();
    await flushPromises();
    expect(wrapper.emitted('rowAction')).toEqual([['feature', 'delete']]);
    wrapper.unmount();
  });

  test('gives readers only the details in the row menu', async () => {
    const wrapper = await mountGantt(false);

    await wrapper.findAll('button[aria-pressed]')[1]?.trigger('keydown', { key: 'ContextMenu' });
    const items = document.body.querySelectorAll<HTMLButtonElement>('[role="menu"] [role="menuitem"]');

    expect(items).toHaveLength(1);
    items[0]?.click();
    await flushPromises();
    expect(wrapper.emitted('select')).toEqual([['feature']]);
    wrapper.unmount();
  });

  test('turns a row green with a tick once everything in it is done', async () => {
    const wrapper = await mountSuspended(PlanGantt, {
      props: {
        rows: buildPlanRows(items, [{ ...task, status: 'done' }]),
        stages: [{ id: 'dev', key: 'development', name: { vi: 'Phát triển', ja: null }, color: '#0f766e', startDate: null, endDate: null, owner: null }],
        timeline: { start: toDayNumber('2026-10-01'), end: toDayNumber('2026-10-31') },
        dayWidth: DAY_WIDTH,
        today: null,
        canEdit: true,
        selectedItemId: null,
        language: 'vi',
      },
    });
    const labels = wrapper.findAll('[data-row-label]');

    expect(labels.map((label) => label.classes().includes('bg-success-soft'))).toEqual([true, true]);
    expect(labels[0]?.text()).toContain('1/1');
    expect(labels[1]?.find('[title="Đã xong hết"]').exists()).toBe(true);

    const pending = await mountGantt();
    expect(pending.find('[data-row-label].bg-success-soft').exists()).toBe(false);
  });

  describe('reordering rows', () => {
    const tree: PlanItem[] = [
      { id: 'phase', parentId: null, kind: 'phase', name: { vi: 'Phase 1' }, position: 1, note: null, priority: null, screenCodes: [] },
      { id: 'module', parentId: 'phase', kind: 'module', name: { vi: 'Thanh toán' }, position: 1, note: null, priority: null, screenCodes: [] },
      { id: 'a', parentId: 'module', kind: 'feature', name: { vi: 'Giỏ hàng' }, position: 1, note: null, priority: null, screenCodes: [] },
      { id: 'b', parentId: 'module', kind: 'feature', name: { vi: 'Mã giảm giá' }, position: 2, note: null, priority: null, screenCodes: [] },
    ];

    async function mountTree(canEdit = true) {
      return mountSuspended(PlanGantt, {
        props: {
          rows: buildPlanRows(tree, []),
          items: tree,
          stages: [],
          timeline: { start: toDayNumber('2026-10-01'), end: toDayNumber('2026-10-10') },
          dayWidth: DAY_WIDTH,
          today: null,
          canEdit,
          selectedItemId: null,
          language: 'vi',
        },
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

    test('drops a feature below another and reports the new place', async () => {
      const wrapper = await mountTree();
      const rows = wrapper.findAll('[data-row-label]').map((label) => label.element.parentElement as Element);
      await drag(at(wrapper.findAll('button[draggable="true"]'), 2).element, 'dragstart');
      await drag(at(rows, 3), 'dragover', 50);
      // A dashed box opens right below the row it will land after.
      const placeholder = wrapper.get('[data-drop-placeholder]');
      expect(placeholder.element.previousElementSibling).toBe(at(rows, 3));
      expect(placeholder.text()).toContain('Thả');
      await drag(at(rows, 3), 'drop', 50);

      expect(wrapper.emitted('moveItem')).toEqual([['a', { parentId: 'module', index: 1 }]]);
    });

    test('ignores a drop on another level', async () => {
      const wrapper = await mountTree();
      const rows = wrapper.findAll('[data-row-label]').map((label) => label.element.parentElement as Element);

      await drag(at(wrapper.findAll('button[draggable="true"]'), 2).element, 'dragstart');
      await drag(at(rows, 0), 'dragover', 50);
      await drag(at(rows, 0), 'drop', 50);

      expect(wrapper.emitted('moveItem')).toBeUndefined();
    });

    test('moves a row one place with the arrow keys, and hides the handle for readers', async () => {
      const wrapper = await mountTree();

      await wrapper.findAll('button[draggable="true"]')[3]?.trigger('keydown', { key: 'ArrowUp' });
      expect(wrapper.emitted('moveItemStep')).toEqual([['b', 'up']]);

      const reader = await mountTree(false);
      expect(reader.find('button[draggable="true"]').exists()).toBe(false);
    });
  });
});
