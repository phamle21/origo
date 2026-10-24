// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanTaskEditor from '@/components/plan/PlanTaskEditor.vue';
import { chooseOption } from '../../../helpers/app-select';

const baseProps = {
  stage: { id: 'uat', color: '#ea580c' },
  stageName: 'UAT',
  members: [{ id: 'm1', role: 'qa' as const, user: { id: 7, name: 'Thảo', email: 'qa@origo.local', title: 'QA', initials: 'T', isActive: true } }],
  canEdit: true,
  suggestedDates: { startDate: '2026-11-02', endDate: '2026-11-06' },
};

describe('PlanTaskEditor', () => {
  test('schedules an unplanned stage from the suggested dates', async () => {
    const wrapper = await mountSuspended(PlanTaskEditor, { props: { ...baseProps, task: null } });

    await wrapper.get('button').trigger('click');
    await chooseOption(wrapper, 'Thảo', 1);
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')).toEqual([[{ startDate: '2026-11-02', endDate: '2026-11-06', status: 'todo', assigneeId: 7 }]]);
  });

  test('blocks an end date before the start date', async () => {
    const wrapper = await mountSuspended(PlanTaskEditor, { props: { ...baseProps, task: null } });

    await wrapper.get('button').trigger('click');
    await wrapper.findAll('input[type="date"]')[1]?.setValue('2026-11-01');

    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  test('shows dates without an edit button for a reader', async () => {
    const task = { id: 't', itemId: 'f', stageId: 'uat', startDate: '2026-11-02', endDate: '2026-11-06', status: 'done' as const, assigneeId: 7 };
    const wrapper = await mountSuspended(PlanTaskEditor, { props: { ...baseProps, canEdit: false, task } });

    expect(wrapper.text()).toContain('Thảo');
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
