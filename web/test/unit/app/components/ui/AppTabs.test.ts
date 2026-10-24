// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppTabs from '@/components/ui/AppTabs.vue';

const props = {
  tabs: [
    { id: 'basic', label: 'Basic' },
    { id: 'detail', label: 'Detail' },
    { id: 'tests', label: 'Tests', count: 2 },
  ],
  modelValue: 'basic',
  label: 'Point details',
  idPrefix: 'p1',
};

describe('AppTabs', () => {
  test('exposes a tablist with only the selected tab in the tab order', async () => {
    const wrapper = await mountSuspended(AppTabs, { props });
    const tabs = wrapper.findAll('[role="tab"]');

    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('Point details');
    expect(tabs.map((tab) => [tab.attributes('aria-selected'), tab.attributes('tabindex')])).toEqual([
      ['true', '0'],
      ['false', '-1'],
      ['false', '-1'],
    ]);
    expect(tabs[0]?.attributes('aria-controls')).toBe('p1-panel-basic');
    expect(tabs[2]?.text()).toContain('2');
  });

  test('omits the count badge when a tab has nothing in it', async () => {
    const wrapper = await mountSuspended(AppTabs, { props: { ...props, tabs: [{ id: 'comments', label: 'Comments', count: 0 }] } });

    expect(wrapper.get('[role="tab"]').text()).toBe('Comments');
  });

  test('selects a tab on click', async () => {
    const wrapper = await mountSuspended(AppTabs, { props });

    await wrapper.findAll('[role="tab"]')[1]?.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['detail']]);
  });

  test('moves with arrow keys and wraps at both ends', async () => {
    const wrapper = await mountSuspended(AppTabs, { props });
    const tablist = wrapper.get('[role="tablist"]');

    await tablist.trigger('keydown', { key: 'ArrowLeft' });
    await tablist.trigger('keydown', { key: 'ArrowRight' });
    await tablist.trigger('keydown', { key: 'End' });
    await tablist.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('update:modelValue')).toEqual([['tests'], ['detail'], ['tests']]);
  });
});
