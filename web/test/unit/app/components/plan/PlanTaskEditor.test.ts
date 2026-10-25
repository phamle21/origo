// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanTaskEditor from '@/components/plan/PlanTaskEditor.vue';
import type { PlanStatus, PlanTask } from '~~/shared/contracts/plan';
import { chooseOption } from '../../../helpers/app-select';

const statuses: PlanStatus[] = [
  { id: 's-new', name: { vi: 'Mới' }, category: 'todo', color: '#94a3b8' },
  { id: 's-doing', name: { vi: 'Đang làm' }, category: 'doing', color: '#2563eb' },
  { id: 's-check', name: { vi: 'Đang kiểm tra' }, category: 'doing', color: '#ca8a04' },
  { id: 's-done', name: { vi: 'Xong' }, category: 'done', color: '#16a34a' },
];

const baseProps = {
  stage: { id: 'uat', color: '#ea580c' },
  stageName: 'UAT',
  statuses,
  language: 'vi',
  members: [{ id: 'm1', role: 'qa' as const, user: { id: 7, name: 'Thảo', email: 'qa@origo.local', title: 'QA', initials: 'T', isActive: true } }],
  canEdit: true,
  suggestedDates: { startDate: '2026-11-02', endDate: '2026-11-06' },
};

const savedTask: PlanTask = {
  id: 't',
  itemId: 'f',
  stageId: 'uat',
  startDate: '2026-11-02',
  endDate: '2026-11-06',
  status: 'doing',
  statusId: 's-check',
  assigneeId: 7,
  estimateDays: 1.5,
  progress: 40,
  link: 'https://example.com/spec',
  note: 'Chờ khách xác nhận',
};

describe('PlanTaskEditor', () => {
  test('schedules an unplanned stage from the suggested dates with the first to-do status', async () => {
    const wrapper = await mountSuspended(PlanTaskEditor, { props: { ...baseProps, task: null } });

    await wrapper.get('button').trigger('click');
    await chooseOption(wrapper, 'Thảo', 1);
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')).toEqual([
      [{ startDate: '2026-11-02', endDate: '2026-11-06', statusId: 's-new', assigneeId: 7, estimateDays: null, progress: null, link: null, note: null }],
    ]);
  });

  test('saves a named status with effort, progress, link and note', async () => {
    const wrapper = await mountSuspended(PlanTaskEditor, { props: { ...baseProps, task: null } });

    await wrapper.get('button').trigger('click');
    await chooseOption(wrapper, 'Đang kiểm tra', 0);
    const [estimate, progress] = wrapper.findAll('input[type="number"]');
    await estimate?.setValue('2.5');
    await progress?.setValue('60');
    await wrapper.get('input[type="text"]').setValue(' https://example.com ');
    await wrapper.get('textarea').setValue('Đợi API');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      statusId: 's-check',
      estimateDays: 2.5,
      progress: 60,
      link: 'https://example.com',
      note: 'Đợi API',
    });
  });

  test('refuses a progress outside 0–100 and an end date before the start date', async () => {
    const wrapper = await mountSuspended(PlanTaskEditor, { props: { ...baseProps, task: null } });

    await wrapper.get('button').trigger('click');
    await wrapper.findAll('input[type="number"]')[1]?.setValue('120');
    expect(wrapper.text()).toContain('Nhập số nguyên từ 0 đến 100.');
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();

    await wrapper.findAll('input[type="number"]')[1]?.setValue('50');
    await wrapper.findAll('input[type="date"]')[1]?.setValue('2026-11-01');
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  test('shows a reader the status name, effort, progress, link and note without an edit button', async () => {
    const wrapper = await mountSuspended(PlanTaskEditor, { props: { ...baseProps, canEdit: false, task: savedTask } });

    expect(wrapper.text()).toContain('Đang kiểm tra');
    expect(wrapper.text()).toContain('Thảo');
    expect(wrapper.text()).toContain('1,5 ngày công');
    expect(wrapper.text()).toContain('xong 40%');
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com/spec');
    expect(wrapper.text()).toContain('Chờ khách xác nhận');
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
