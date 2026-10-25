import { describe, expect, test } from 'vitest';
import { assignLanes, buildPlanRows, isRowDone } from '@/utils/plan-tree';
import { toDayNumber } from '@/utils/plan-dates';
import type { PlanItem, PlanTask } from '~~/shared/contracts/plan';

function item(id: string, kind: PlanItem['kind'], parentId: string | null, position = 0): PlanItem {
  return { id, kind, parentId, position, name: { vi: id, ja: null }, note: null, priority: null, screenCodes: [] };
}

function task(id: string, itemId: string, startDate: string, endDate: string, status: PlanTask['status'] = 'todo'): PlanTask {
  return {
    id,
    itemId,
    stageId: `stage-${id}`,
    startDate,
    endDate,
    status,
    assigneeId: null,
    statusId: null,
    estimateDays: null,
    progress: null,
    link: null,
    note: null,
  };
}

const items = [
  item('feature-b', 'feature', 'module', 1),
  item('phase', 'phase', null),
  item('module', 'module', 'phase'),
  item('feature-a', 'feature', 'module', 0),
  item('empty-phase', 'phase', null, 1),
];
const tasks = [task('t1', 'feature-a', '2026-10-01', '2026-10-05', 'done'), task('t2', 'feature-b', '2026-10-04', '2026-10-12')];

describe('buildPlanRows', () => {
  test('lists phases, modules and features depth first in position order', () => {
    expect(buildPlanRows(items, tasks).map((row) => [row.item.id, row.depth])).toEqual([
      ['phase', 0],
      ['module', 1],
      ['feature-a', 2],
      ['feature-b', 2],
      ['empty-phase', 0],
    ]);
  });

  test('sums the span and progress of everything below a row', () => {
    const [phase, , featureA] = buildPlanRows(items, tasks);

    expect(phase).toMatchObject({ span: { start: toDayNumber('2026-10-01'), end: toDayNumber('2026-10-12') }, taskCount: 2, doneCount: 1, tasks: [] });
    expect(featureA?.tasks.map((own) => own.id)).toEqual(['t1']);
  });

  test('hides the children of a collapsed row but keeps its summary', () => {
    const rows = buildPlanRows(items, tasks, new Set(['phase']));

    expect(rows.map((row) => row.item.id)).toEqual(['phase', 'empty-phase']);
    expect(rows[0]).toMatchObject({ isCollapsed: true, hasChildren: true, taskCount: 2 });
    expect(rows[1]).toMatchObject({ span: null, hasChildren: false });
  });

  test('returns nothing for an empty plan', () => {
    expect(buildPlanRows([], [])).toEqual([]);
  });
});

describe('assignLanes', () => {
  test('stacks only the bars that overlap', () => {
    const { lanes, laneCount } = assignLanes([
      { id: 'a', range: { start: 1, end: 5 } },
      { id: 'b', range: { start: 3, end: 8 } },
      { id: 'c', range: { start: 6, end: 9 } },
    ]);

    expect(Object.fromEntries(lanes)).toEqual({ a: 0, b: 1, c: 0 });
    expect(laneCount).toBe(2);
  });

  test('keeps one lane for an empty row', () => {
    expect(assignLanes([]).laneCount).toBe(1);
  });
});

describe('isRowDone', () => {
  test('is done only when something is scheduled and all of it is done', () => {
    expect(isRowDone({ taskCount: 3, doneCount: 3 })).toBe(true);
    expect(isRowDone({ taskCount: 3, doneCount: 2 })).toBe(false);
    expect(isRowDone({ taskCount: 0, doneCount: 0 })).toBe(false);
  });
});
