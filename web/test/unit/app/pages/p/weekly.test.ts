// @vitest-environment nuxt
import { describe, expect, test, vi } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import WeeklyPage from '@/pages/p/[code]/weekly.vue';
import type { PlanWeeklyReport } from '~~/shared/contracts/plan';

const { updateMock, recordMock, refreshMock } = vi.hoisted(() => ({ updateMock: vi.fn(), recordMock: vi.fn(), refreshMock: vi.fn() }));

const stage = { stageId: 'dev', name: { vi: 'Phát triển' }, estimateDays: 10, actualDays: 5, remainingDays: 5, progress: 0.5, basis: 'effort' as const };
const snapshot = (progress: number) => ({
  overall: {
    estimateDays: 10,
    actualDays: progress * 10,
    remainingDays: 10 - progress * 10,
    progress,
    basis: 'effort' as const,
    timeElapsed: 0.5,
    doneCount: 1,
    taskCount: 2,
  },
  stages: [{ ...stage, progress }],
});
const report: PlanWeeklyReport = {
  canEdit: true,
  currentWeek: '2026-10-19',
  members: [{ id: 7, name: 'Thảo', title: 'QA' }],
  weeks: [
    { weekStart: '2026-10-05', snapshot: snapshot(0.3), snapshotAt: null, summary: null, hours: { 7: 30 } },
    { weekStart: '2026-10-12', snapshot: snapshot(0.45), snapshotAt: null, summary: { vi: 'Xong giỏ hàng' }, hours: { 7: 32 } },
    { weekStart: '2026-10-19', snapshot: null, snapshotAt: null, summary: null, hours: {} },
  ],
};

vi.mock('@/api/plan/plan', () => ({ updatePlanWeek: updateMock, recordPlanWeek: recordMock, planExportUrl: () => '/export' }));
mockNuxtImport('usePlanWeekly', () => () => ({ data: ref(report), isPending: ref(false), hasFailed: ref(false), errorMessage: ref(''), refresh: refreshMock }));
mockNuxtImport('useProjectScreens', () => () => ({ data: ref<null>(null) }));
mockNuxtImport('useProjectRoute', () => () => ({ code: ref('LMS') }));

describe('weekly report page', () => {
  test('lists recorded progress with the change from the week before, and hours per member', async () => {
    const wrapper = await mountSuspended(WeeklyPage);

    expect(wrapper.text()).toContain('45%');
    expect(wrapper.text()).toContain('+15%');
    expect(wrapper.text()).toContain('chưa chốt');
    expect(wrapper.text()).toContain('62');
  });

  test('saves the current week’s summary and hours, and records the week on request', async () => {
    updateMock.mockResolvedValue({ ok: true });
    recordMock.mockResolvedValue({ ok: true });
    const wrapper = await mountSuspended(WeeklyPage);

    await wrapper.get('textarea').setValue('Bắt đầu UAT');
    await wrapper.get('input[type="number"]').setValue('38');
    await wrapper.get('form').trigger('submit');
    await new Promise((resolve) => setTimeout(resolve));

    expect(updateMock).toHaveBeenCalledWith('LMS', '2026-10-19', { summary: expect.objectContaining({ vi: 'Bắt đầu UAT' }), hours: { 7: 38 } });

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Chốt số liệu tuần này'))
      ?.trigger('click');
    await new Promise((resolve) => setTimeout(resolve));
    expect(recordMock).toHaveBeenCalledWith('LMS', '2026-10-19');
  });
});
