// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlanSummaryPanel from '@/components/plan/PlanSummaryPanel.vue';
import type { PlanSummary } from '~~/shared/contracts/plan';

const stages = [{ id: 'dev', key: 'dev', name: { vi: 'Phát triển' }, color: '#0f766e', startDate: '2026-10-01', endDate: '2026-10-10', owner: 'VN' }];

function summary(overrides: Partial<PlanSummary['overall']> = {}): PlanSummary {
  return {
    today: '2026-10-21',
    overall: {
      estimateDays: 10,
      actualDays: 4,
      remainingDays: 6,
      progress: 0.4,
      basis: 'effort',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      workingDays: 22,
      workingDaysPassed: 15,
      timeElapsed: 0.68,
      taskCount: 5,
      doneCount: 2,
      ...overrides,
    },
    stages: [
      {
        stageId: 'dev',
        estimateDays: 10,
        actualDays: 4,
        remainingDays: 6,
        progress: 0.4,
        basis: 'effort',
        owner: 'VN',
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        workingDays: 8,
        isLate: true,
      },
    ],
  };
}

describe('PlanSummaryPanel', () => {
  test('shows man-days, time passed and a late stage, and warns when work lags behind time', async () => {
    const wrapper = await mountSuspended(PlanSummaryPanel, { props: { summary: summary(), stages, language: 'vi' } });

    expect(wrapper.text()).toContain('40%');
    expect(wrapper.text()).toContain('Đã làm 4 / 10 ngày công (còn 6)');
    expect(wrapper.text()).toContain('Đã qua 15 / 22 ngày làm việc (còn 7)');
    expect(wrapper.text()).toContain('Chậm tiến độ');
    expect(wrapper.text()).toContain('Phát triển');
    expect(wrapper.text()).toContain('VN');
    expect(wrapper.text()).toContain('Trễ');
  });

  test('counts tasks when nothing is estimated and does not warn when on time', async () => {
    const wrapper = await mountSuspended(PlanSummaryPanel, {
      props: {
        summary: summary({ basis: 'count', estimateDays: 0, actualDays: 0, remainingDays: 0, progress: 0.7, timeElapsed: 0.68 }),
        stages,
        language: 'vi',
      },
    });

    expect(wrapper.text()).toContain('Xong 2 / 5 việc');
    expect(wrapper.text()).not.toContain('Chậm tiến độ');
  });
});
