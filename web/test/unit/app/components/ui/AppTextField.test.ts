// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppTextField from '@/components/ui/AppTextField.vue';

describe('AppTextField', () => {
  test('links the label and announces an error on the input', async () => {
    const wrapper = await mountSuspended(AppTextField, { props: { modelValue: '', label: 'Email', isRequired: true, error: 'Vui lòng nhập ô này.' } });
    const input = wrapper.get('input');

    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'));
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get(`#${input.attributes('aria-describedby')}`).text()).toContain('Vui lòng nhập ô này.');
  });

  test('reports typing and leaving the field', async () => {
    const wrapper = await mountSuspended(AppTextField, { props: { modelValue: '', label: 'Tên', hint: 'Họ và tên' } });

    await wrapper.get('input').setValue('Lan');
    await wrapper.get('input').trigger('blur');

    expect(wrapper.emitted('update:modelValue')).toEqual([['Lan']]);
    expect(wrapper.emitted('blur')).toHaveLength(1);
    expect(wrapper.text()).toContain('Họ và tên');
  });
});
