// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanNoteDialog from '@/components/plan/PlanNoteDialog.vue';

describe('PlanNoteDialog', () => {
  test('lets an editor change and save the note', async () => {
    const wrapper = await mountSuspended(PlanNoteDialog, { props: { open: true, itemName: 'Giỏ hàng', note: 'Chờ giá.', canEdit: true } });
    const note = wrapper.get('textarea');

    expect((note.element as HTMLTextAreaElement).value).toBe('Chờ giá.');
    await note.setValue('  Đã có giá.  ');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')).toEqual([['Đã có giá.']]);
  });

  test('shows the note read-only, keeping line breaks, for readers', async () => {
    const wrapper = await mountSuspended(PlanNoteDialog, { props: { open: true, itemName: 'Giỏ hàng', note: 'Dòng 1\nDòng 2', canEdit: false } });

    expect(wrapper.find('textarea').exists()).toBe(false);
    expect(wrapper.get('.whitespace-pre-line').text()).toContain('Dòng 1');
  });
});
