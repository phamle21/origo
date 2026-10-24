import { describe, expect, test } from 'vitest';
import { mount } from '@vue/test-utils';
import AppButton from '@/components/ui/AppButton.vue';

describe('AppButton', () => {
  test('renders the slot label and defaults to a non-submitting button', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Add to cart' } });

    expect(wrapper.text()).toBe('Add to cart');
    expect(wrapper.attributes('type')).toBe('button');
  });

  test('emits a click when enabled', async () => {
    const wrapper = mount(AppButton, { slots: { default: 'Retry' } });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  test('is disabled and emits nothing when disabled', async () => {
    const wrapper = mount(AppButton, { props: { isDisabled: true }, slots: { default: 'Retry' } });

    await wrapper.trigger('click');

    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  test('applies the variant styling through semantic tokens', () => {
    expect(mount(AppButton).classes()).toContain('bg-accent');
    expect(mount(AppButton, { props: { variant: 'secondary' } }).classes()).toContain('bg-surface');
  });

  test('can submit a form when asked', () => {
    expect(mount(AppButton, { props: { type: 'submit' } }).attributes('type')).toBe('submit');
  });
});
