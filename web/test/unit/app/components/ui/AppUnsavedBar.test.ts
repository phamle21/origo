// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';

describe('AppUnsavedBar', () => {
  test('stays hidden without changes', async () => {
    const wrapper = await mountSuspended(AppUnsavedBar, { props: { show: false } });

    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  test('offers undo and save, and submits a named form', async () => {
    const wrapper = await mountSuspended(AppUnsavedBar, { props: { show: true, form: 'profile-form' } });
    const [undo, save] = wrapper.findAll('button');

    await undo?.trigger('click');
    expect(wrapper.emitted('discard')).toHaveLength(1);
    expect(save?.attributes('type')).toBe('submit');
    expect(save?.attributes('form')).toBe('profile-form');
  });

  test('emits save when it has no form to submit, and locks while saving', async () => {
    const wrapper = await mountSuspended(AppUnsavedBar, { props: { show: true } });

    await wrapper.findAll('button')[1]?.trigger('click');
    expect(wrapper.emitted('save')).toHaveLength(1);

    await wrapper.setProps({ isSaving: true });
    expect(wrapper.findAll('button[disabled]')).toHaveLength(2);
  });
});
