// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import EditorScreenSourceInput from '@/components/editor/EditorScreenSourceInput.vue';
import { chooseOption, openSelect, optionLabels } from '../../../helpers/app-select';

async function chooseFile(input: Element, file: File) {
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change'));
}

describe('EditorScreenSourceInput', () => {
  test('emits a URL source only once the address is a usable http(s) URL', async () => {
    const wrapper = await mountSuspended(EditorScreenSourceInput, { props: { modelValue: null } });

    await wrapper.get('input[value="url"]').trigger('change');
    await wrapper.get('input[type="url"]').setValue('example.com');
    await wrapper.get('input[type="url"]').setValue('https://example.com/cart');
    await openSelect(wrapper);
    await chooseOption(wrapper, optionLabels(wrapper).find((label) => label.includes('390')) ?? '');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ kind: 'url', url: 'https://example.com/cart', width: 390 }]);
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([null]);
  });

  test('accepts an html or zip file and rejects other files', async () => {
    const wrapper = await mountSuspended(EditorScreenSourceInput, { props: { modelValue: null } });

    await wrapper.get('input[value="html"]').trigger('change');
    await chooseFile(wrapper.get('input[type="file"]').element, new File(['x'], 'notes.pdf'));
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[role="alert"]').text()).toContain('.html, .htm hoặc .zip');

    await chooseFile(wrapper.get('input[type="file"]').element, new File(['<h1>'], 'mockup.zip'));

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ kind: 'html', file: expect.any(File), width: 1440 }]);
  });

  test('shows no capture size for an image source', async () => {
    const wrapper = await mountSuspended(EditorScreenSourceInput, { props: { modelValue: null } });

    expect(wrapper.find('button[role="combobox"]').exists()).toBe(false);
  });
});
