// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppSelect from '@/components/ui/AppSelect.vue';
import { matchesSearch } from '@/utils/search';
import { chooseOption, openSelect, optionLabels, selectedLabel } from '../../../helpers/app-select';

const short = [
  { value: 'todo', label: 'Chưa làm' },
  { value: 'done', label: 'Xong' },
];
const long = Array.from({ length: 9 }, (_, index) => ({ value: index, label: index === 4 ? 'Quản lý dự án' : `Vai trò ${index}` }));

describe('AppSelect', () => {
  test('shows the chosen label and picks another option', async () => {
    const wrapper = await mountSuspended(AppSelect, { props: { modelValue: 'todo', options: short } });

    expect(selectedLabel(wrapper)).toBe('Chưa làm');
    await chooseOption(wrapper, 'Xong');
    expect(wrapper.emitted('update:modelValue')).toEqual([['done']]);
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });

  test('short lists open without a search box, long ones with one that ignores accents', async () => {
    const shortBox = await mountSuspended(AppSelect, { props: { modelValue: 'todo', options: short } });
    await openSelect(shortBox);
    expect(shortBox.find('input[type="search"]').exists()).toBe(false);

    const longBox = await mountSuspended(AppSelect, { props: { modelValue: 0, options: long } });
    await openSelect(longBox);
    await longBox.get('input[type="search"]').setValue('quan ly');
    await flushPromises();
    expect(optionLabels(longBox)).toEqual(['Quản lý dự án']);

    await longBox.get('input[type="search"]').trigger('keydown', { key: 'Enter' });
    expect(longBox.emitted('update:modelValue')).toEqual([[4]]);
  });

  test('opens from the keyboard and does nothing while disabled', async () => {
    const wrapper = await mountSuspended(AppSelect, { props: { modelValue: 'todo', options: short, isDisabled: true } });

    await wrapper.get('button').trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);

    await wrapper.setProps({ isDisabled: false });
    await wrapper.get('button').trigger('keydown', { key: 'ArrowDown' });
    await flushPromises();
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true);
  });

  test('search matches every word without accents', () => {
    expect(matchesSearch(['Đăng ký & đăng nhập'], 'dang nhap')).toBe(true);
    expect(matchesSearch(['Giỏ hàng'], 'gio thanh')).toBe(false);
    expect(matchesSearch(['Bất kỳ'], '')).toBe(true);
  });
});
