// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { reactive, ref } from 'vue';
import { z } from 'zod';
import { useFormValidation } from '@/composables/useFormValidation';
import { formRules } from '@/utils/form-rules';
import type { ApiErrorFields } from '~~/shared/contracts/api-error';
import { withSetup } from './with-setup';

const schema = z.object({ name: formRules.requiredText(5), email: formRules.email(), label: formRules.localized(3, true) });

describe('useFormValidation', () => {
  test('stays quiet while typing, then explains a field once it is left', async () => {
    const values = reactive({ name: '', email: 'x', label: { vi: null as string | null, ja: null } });
    const form = await withSetup(() => useFormValidation(schema, () => values));

    expect(form.error('name')).toBe('');
    form.touch('name');
    expect(form.error('name')).not.toBe('');

    values.name = 'toolong';
    expect(form.error('name')).toContain('5');
  });

  test('shows every problem after a submit attempt and passes once fixed', async () => {
    const values = reactive({ name: 'Lan', email: 'lan@', label: { vi: '', ja: null } });
    const form = await withSetup(() => useFormValidation(schema, () => values));

    expect(form.validate()).toBe(false);
    expect(form.error('email')).not.toBe('');
    expect(form.error('label.vi')).not.toBe('');

    Object.assign(values, { email: 'lan@origo.local', label: { vi: 'QA', ja: null } });
    expect(form.validate()).toBe(true);
    expect(form.error('email')).toBe('');

    form.reset();
    values.email = '';
    expect(form.error('email')).toBe('');
  });

  test('shows the reason the API gave for a field the browser could not check', async () => {
    const serverFields = ref<ApiErrorFields | null>({ email: ['taken'] });
    const values = { name: 'Lan', email: 'lan@origo.local', label: { vi: 'QA', ja: null } };
    const form = await withSetup(() => useFormValidation(schema, () => values, { serverFields }));

    expect(form.error('email')).not.toBe('');
    serverFields.value = null;
    expect(form.error('email')).toBe('');
  });
});
