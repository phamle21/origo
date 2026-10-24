// @vitest-environment nuxt
import { describe, expect, test, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import UserPicker from '@/components/team/UserPicker.vue';

const people = [
  { id: 1, name: 'Minh Anh', email: 'ba@origo.local', title: 'BA', initials: 'MA' },
  { id: 2, name: 'Quang', email: 'dev@origo.local', title: 'Dev', initials: 'Q' },
];

const waitForSearch = () => new Promise((resolve) => setTimeout(resolve, 300));

describe('UserPicker', () => {
  test('searches after two letters, hides excluded people and emits the pick', async () => {
    const search = vi.fn().mockResolvedValue(people);
    const wrapper = await mountSuspended(UserPicker, { props: { label: 'Người', search, excludeIds: [1] } });

    await wrapper.get('input').setValue('q');
    await waitForSearch();
    expect(search).not.toHaveBeenCalled();

    await wrapper.get('input').setValue('qu');
    await waitForSearch();
    expect(search).toHaveBeenCalledWith('qu');

    const options = wrapper.findAll('[role="option"]');

    expect(options.map((option) => option.text())).toEqual([expect.stringContaining('Quang')]);
    await options[0]?.trigger('mousedown');
    expect(wrapper.emitted('pick')).toEqual([[people[1]]]);
  });

  test('says so when nobody matches, also when the search fails', async () => {
    const wrapper = await mountSuspended(UserPicker, { props: { label: 'Người', search: vi.fn().mockRejectedValue(new Error('down')) } });

    await wrapper.get('input').setValue('zz');
    await waitForSearch();

    expect(wrapper.get('[role="listbox"]').text()).not.toBe('');
    expect(wrapper.findAll('[role="option"]')).toHaveLength(0);
  });
});
