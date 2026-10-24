// @vitest-environment nuxt
import { beforeAll, describe, expect, test } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppTypeToConfirmDialog from '@/components/ui/AppTypeToConfirmDialog.vue';

describe('AppTypeToConfirmDialog', () => {
  beforeAll(() => {
    // happy-dom has no modal dialog support.
    HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  test('only confirms once the exact phrase is typed', async () => {
    const wrapper = await mountSuspended(AppTypeToConfirmDialog, {
      props: { open: true, title: 'Xóa vĩnh viễn dự án LMS?', phrase: 'LMS', confirmLabel: 'Xóa', consequences: ['Mất hết màn hình'] },
      attachTo: document.body,
    });
    await flushPromises();
    const submit = () => wrapper.get('button[type="submit"]');

    expect(wrapper.text()).toContain('Mất hết màn hình');
    expect(submit().attributes('disabled')).toBeDefined();

    await wrapper.get('input').setValue('lms');
    expect(submit().attributes('disabled')).toBeDefined();
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('confirm')).toBeUndefined();

    await wrapper.get('input').setValue(' LMS ');
    expect(submit().attributes('disabled')).toBeUndefined();
    await wrapper.get('form').trigger('submit');
    expect(wrapper.emitted('confirm')).toEqual([['LMS']]);
    wrapper.unmount();
  });
});
