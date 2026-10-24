// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';

describe('AppCheckbox', () => {
  test('stays a native checkbox and reports the new state', async () => {
    const wrapper = await mountSuspended(AppCheckbox, { props: { modelValue: false }, attrs: { 'aria-label': 'Sửa kế hoạch' } });
    const input = wrapper.get('input[type="checkbox"]');

    expect(input.attributes('aria-label')).toBe('Sửa kế hoạch');
    await input.setValue(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
  });

  test('can be disabled and drawn smaller', async () => {
    const wrapper = await mountSuspended(AppCheckbox, { props: { modelValue: true, isDisabled: true, size: 'md' } });

    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
    expect(wrapper.classes()).toContain('size-5');
  });
});
