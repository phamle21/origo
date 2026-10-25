import { describe, expect, test } from 'vitest';
import { planWeeklyDtoSchema, projectPlanDtoSchema } from '~~/server/integrations/origo-api/dto/plan.dto';

const effort = { estimateDays: 0, actualDays: 0, remainingDays: 0, progress: null, basis: 'count' };

describe('plan DTOs', () => {
  test('reads a plan saved before tracking fields existed, filling them with nulls', () => {
    const plan = projectPlanDtoSchema.parse({
      data: {
        canEdit: true,
        stages: [{ id: 's', key: 'dev', name: { vi: 'Phát triển' }, color: '#0f766e' }],
        items: [{ id: 'f', parentId: null, kind: 'feature', name: { vi: 'Giỏ hàng' }, position: 1 }],
        tasks: [{ id: 't', itemId: 'f', stageId: 's', startDate: '2026-10-01', endDate: '2026-10-02', status: 'doing', assigneeId: null }],
        summary: {
          today: '2026-10-25',
          overall: { ...effort, startDate: null, endDate: null, workingDays: null, workingDaysPassed: null, timeElapsed: null, taskCount: 1, doneCount: 0 },
          stages: [],
        },
      },
    }).data;

    expect(plan.statuses).toEqual([]);
    expect(plan.stages[0]).toMatchObject({ startDate: null, endDate: null, owner: null });
    expect(plan.items[0]).toMatchObject({ note: null, priority: null });
    expect(plan.tasks[0]).toMatchObject({ statusId: null, estimateDays: null, progress: null, link: null, note: null });
  });

  test('accepts the empty hours map PHP sends as a list', () => {
    const report = planWeeklyDtoSchema.parse({
      data: {
        canEdit: false,
        currentWeek: '2026-10-19',
        members: [],
        weeks: [{ weekStart: '2026-10-19', snapshot: null, snapshotAt: null, summary: null, hours: [] }],
      },
    }).data;

    expect(report.weeks[0]?.hours).toEqual({});
  });
});
