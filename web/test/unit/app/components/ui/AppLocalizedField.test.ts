// @vitest-environment nuxt
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import type { ContentLanguageOption } from '~~/shared/contracts/content';

const { translateContentMock } = vi.hoisted(() => ({ translateContentMock: vi.fn() }));

vi.mock('@/api/content/content', () => ({ translateContent: translateContentMock }));
mockNuxtImport('useConfirm', () => () => () => Promise.resolve(true));

function setLanguages(codes: [string, string][]): void {
  useState<ContentLanguageOption[]>('content-languages').value = codes.map(([code, name]) => ({ code, name, isActive: true, isDefault: code === 'vi' }));
}

describe('AppLocalizedField', () => {
  beforeAll(() => {
    // happy-dom has no modal dialog support.
    HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  beforeEach(() =>
    setLanguages([
      ['vi', 'Tiếng Việt'],
      ['ja', '日本語'],
      ['en', 'English'],
    ]),
  );

  afterEach(() => translateContentMock.mockReset());

  test('shows only the required Vietnamese box and a button counting the other languages', async () => {
    const wrapper = await mountSuspended(AppLocalizedField, { props: { modelValue: { vi: 'Giá', ja: '価格', en: null }, label: 'Tên', isRequired: true } });
    const inputs = wrapper.findAll('input');

    expect(inputs.map((input) => input.attributes('lang'))).toEqual(['vi']);
    expect(inputs[0]?.attributes('required')).toBeDefined();
    expect(inputs[0]?.element.value).toBe('Giá');
    expect(wrapper.get('button').text()).toBe('1/2');
  });

  test('hides the language button when only Vietnamese is in use', async () => {
    setLanguages([['vi', 'Tiếng Việt']]);
    const wrapper = await mountSuspended(AppLocalizedField, { props: { modelValue: { vi: null }, label: 'Tên' } });

    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  test('typing in the box keeps hidden languages and turns a cleared box into null', async () => {
    // "ko" is not set up (switched off): its translation must travel back unchanged.
    const wrapper = await mountSuspended(AppLocalizedField, { props: { modelValue: { vi: 'Giá', ja: '価格', ko: '가격' }, label: 'Tên', isMultiline: true } });

    await wrapper.get('textarea').setValue('');

    expect(wrapper.emitted('update:modelValue')).toEqual([[{ vi: null, ja: '価格', ko: '가격' }]]);
  });

  test('the dialog edits every language, the source included, and applies only on Done', async () => {
    const wrapper = await mountSuspended(AppLocalizedField, { props: { modelValue: { vi: 'Giá', ja: null }, label: 'Tên' }, attachTo: document.body });

    await wrapper.get('button').trigger('click');
    await flushPromises();
    const dialogInputs = wrapper.findAll('dialog input');

    expect(dialogInputs.map((input) => input.attributes('lang'))).toEqual(['vi', 'ja', 'en']);
    await dialogInputs[1]?.setValue('価格');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();

    await wrapper
      .findAll('dialog button')
      .find((button) => button.text() === 'Xong')
      ?.trigger('click');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ vi: 'Giá', ja: '価格' }]);
    wrapper.unmount();
  });

  test('translates the empty languages from the Vietnamese text', async () => {
    translateContentMock.mockResolvedValue({ translations: { ja: '価格', en: null } });
    const wrapper = await mountSuspended(AppLocalizedField, { props: { modelValue: { vi: 'Giá' }, label: 'Tên' }, attachTo: document.body });

    await wrapper.get('button').trigger('click');
    await flushPromises();
    await wrapper
      .findAll('dialog button')
      .find((button) => button.text().includes('Dịch các ô còn trống'))
      ?.trigger('click');
    await flushPromises();

    expect(translateContentMock).toHaveBeenCalledWith({ text: 'Giá', from: 'vi', to: ['ja', 'en'] });
    expect(wrapper.get<HTMLInputElement>('dialog input[lang="ja"]').element.value).toBe('価格');
    expect(wrapper.text()).toContain('Có ngôn ngữ chưa dịch được');
    wrapper.unmount();
  });

  test('flags an invalid other language on the button and shows the source message under the box', async () => {
    const wrapper = await mountSuspended(AppLocalizedField, {
      props: {
        modelValue: { vi: null },
        label: 'Tên',
        errorFor: (locale: string) => (locale === 'vi' ? 'Vui lòng nhập ô này.' : locale === 'ja' ? 'Quá dài.' : ''),
      },
    });

    expect(wrapper.get('input[lang="vi"]').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Vui lòng nhập ô này.');
    expect(wrapper.get('button').classes()).toContain('border-danger');
  });
});
