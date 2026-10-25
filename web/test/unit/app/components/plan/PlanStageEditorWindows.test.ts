// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanStageEditor from '@/components/plan/PlanStageEditor.vue';

const stages = [{ id: 'dev', key: 'dev', name: { vi: 'Phát triển' }, color: '#0f766e', startDate: null, endDate: null, owner: null }];

describe('PlanStageEditor with stage windows', () => {
  test('saves a project stage window and owner', async () => {
    const wrapper = await mountSuspended(PlanStageEditor, { props: { stages, formId: 'f', hasWindows: true } });
    const [start, end] = wrapper.findAll('input[type="date"]');

    await start?.setValue('2026-10-01');
    await end?.setValue('2026-10-20');
    await wrapper.get('input[maxlength="30"]').setValue(' VN ');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual([
      { id: 'dev', name: { vi: 'Phát triển' }, color: '#0f766e', startDate: '2026-10-01', endDate: '2026-10-20', owner: 'VN' },
    ]);
  });

  test('refuses an end before the start, and the system template has no window fields', async () => {
    const wrapper = await mountSuspended(PlanStageEditor, { props: { stages, formId: 'f', hasWindows: true } });
    const [start, end] = wrapper.findAll('input[type="date"]');

    await start?.setValue('2026-10-20');
    await end?.setValue('2026-10-01');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')).toBeUndefined();
    expect(wrapper.text()).toContain('Ngày kết thúc');

    const template = await mountSuspended(PlanStageEditor, { props: { stages, formId: 'g' } });
    expect(template.find('input[type="date"]').exists()).toBe(false);
  });
});
