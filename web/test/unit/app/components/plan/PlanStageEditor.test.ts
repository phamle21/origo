// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanStageEditor from '@/components/plan/PlanStageEditor.vue';
import { useConfirmStore } from '@/stores/useConfirmStore';

const stages = [
  { id: 'bd', key: 'basic-design', name: { vi: 'Thiết kế', ja: null }, color: '#7c3aed', startDate: null, endDate: null, owner: null },
  { id: 'dev', key: 'development', name: { vi: 'Phát triển', ja: null }, color: '#0f766e', startDate: null, endDate: null, owner: null },
];

async function mountEditor() {
  return mountSuspended(PlanStageEditor, { props: { stages, formId: 'stages', taskCounts: { dev: 3 } } });
}

// jsdom has no DragEvent; a plain event with the drag names and a pointer position stands in.
async function drag(element: Element | undefined, type: string, clientY = 0) {
  element?.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientY }));
  await nextTick();
}

describe('PlanStageEditor', () => {
  test('reorders stages by dragging, with a dashed box where the stage will land', async () => {
    const wrapper = await mountEditor();
    const rows = wrapper.findAll('[data-stage-row]');

    await drag(wrapper.findAll('button[draggable="true"]')[0]?.element, 'dragstart');
    await drag(rows[1]?.element, 'dragover', 50);

    const placeholder = wrapper.get('[data-drop-placeholder]');
    expect(placeholder.element.previousElementSibling).toBe(rows[1]?.element);
    expect(placeholder.text()).toContain('Thiết kế');

    await drag(placeholder.element, 'drop');
    expect(wrapper.findAll<HTMLInputElement>('[data-stage-row] input[type="text"]').map((input) => input.element.value)).toEqual(['Phát triển', 'Thiết kế']);
    expect(wrapper.emitted('update:isDirty')?.at(-1)).toEqual([true]);
  });

  test('picks a stage colour from the palette', async () => {
    const wrapper = await mountEditor();

    await wrapper.get('button[aria-label="Màu giai đoạn 1"]').trigger('click');
    await wrapper.get('button[aria-label="#dc2626"]').trigger('click');

    expect(wrapper.get('[data-stage-row] span[aria-hidden="true"]').attributes('style')).toContain('rgb(220, 38, 38)');
  });

  test('asks before removing a stage that has tasks and shows what saving will delete', async () => {
    const wrapper = await mountEditor();
    const confirmStore = useConfirmStore();
    const removeDev = wrapper.findAll('li')[1]?.findAll('button').at(-1);

    await removeDev?.trigger('click');
    expect(confirmStore.request?.tone).toBe('danger');
    confirmStore.settle(true);
    await flushPromises();

    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.get('[role="status"]').text()).toContain('Phát triển');
    expect(wrapper.emitted('update:isDirty')?.at(-1)).toEqual([true]);
  });

  test('keeps the stage when the removal is cancelled, and removes an empty stage without asking', async () => {
    const wrapper = await mountEditor();
    const confirmStore = useConfirmStore();

    await wrapper.findAll('li')[1]?.findAll('button').at(-1)?.trigger('click');
    confirmStore.settle(false);
    await flushPromises();
    expect(wrapper.findAll('li')).toHaveLength(2);

    await wrapper.findAll('li')[0]?.findAll('button').at(-1)?.trigger('click');
    await flushPromises();
    expect(confirmStore.request).toBeNull();
    expect(wrapper.findAll('li')).toHaveLength(1);
  });

  test('refuses to save a stage without a Vietnamese name, and undoes changes', async () => {
    const wrapper = await mountEditor();

    await wrapper.findAll('input[type="text"]')[0]?.setValue('');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('save')).toBeUndefined();
    expect(wrapper.find('[aria-invalid="true"]').exists()).toBe(true);

    const undo = wrapper.findAll('button').find((button) => /Hoàn tác|Undo|元に戻す/.test(button.text()));

    await undo?.trigger('click');
    expect(wrapper.get<HTMLInputElement>('input[type="text"]').element.value).toBe('Thiết kế');

    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual([
      { id: 'bd', name: { vi: 'Thiết kế', ja: null }, color: '#7c3aed' },
      { id: 'dev', name: { vi: 'Phát triển', ja: null }, color: '#0f766e' },
    ]);
  });
});
