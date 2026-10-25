import { describe, expect, test } from 'vitest';
import { emptyPlanFilter, filterPlan, isPlanFilterActive } from '@/utils/plan-filter';
import type { PlanItem, PlanTask } from '~~/shared/contracts/plan';

function item(id: string, kind: PlanItem['kind'], parentId: string | null, name: string): PlanItem {
  return { id, kind, parentId, position: 0, name: { vi: name }, note: null, priority: null, screenCodes: [] };
}

function task(id: string, itemId: string, stageId: string, endDate: string, status: PlanTask['status'], assigneeId: number | null): PlanTask {
  return {
    id,
    itemId,
    stageId,
    startDate: '2026-10-01',
    endDate,
    status,
    assigneeId,
    statusId: null,
    estimateDays: null,
    progress: null,
    link: null,
    note: null,
  };
}

const items = [
  item('p', 'phase', null, 'Phase 1'),
  item('m', 'module', 'p', 'Thanh toán'),
  item('a', 'feature', 'm', 'Giỏ hàng'),
  item('b', 'feature', 'm', 'Mã giảm giá'),
  item('m2', 'module', 'p', 'Báo cáo'),
];
const tasks = [
  task('t1', 'a', 'dev', '2026-10-10', 'doing', 3),
  task('t2', 'b', 'dev', '2026-10-30', 'todo', null),
  task('t3', 'b', 'qa', '2026-10-05', 'done', 3),
];
const names = (entry: PlanItem) => [entry.name.vi ?? ''];
const run = (patch: Partial<ReturnType<typeof emptyPlanFilter>>) => filterPlan(items, tasks, { ...emptyPlanFilter(), ...patch }, names, '2026-10-20');

describe('filterPlan', () => {
  test('shows everything without a filter', () => {
    expect(isPlanFilterActive(emptyPlanFilter())).toBe(false);
    expect(run({}).items).toHaveLength(5);
  });

  test('a name search keeps the matching feature with its parents, or a whole matching module', () => {
    expect(run({ query: 'giảm' }).items.map((entry) => entry.id)).toEqual(['p', 'm', 'b']);
    expect(run({ query: 'thanh toán' }).items.map((entry) => entry.id)).toEqual(['p', 'm', 'a', 'b']);
    expect(run({ query: 'báo cáo' }).items.map((entry) => entry.id)).toEqual(['p', 'm2']);
  });

  test('entry criteria keep only matching bars and the features that still have one', () => {
    expect(run({ assignee: 3 }).tasks.map((entry) => entry.id)).toEqual(['t1', 't3']);
    expect(run({ assignee: 'none' }).items.map((entry) => entry.id)).toEqual(['p', 'm', 'b']);
    expect(run({ stageId: 'qa', statuses: ['done'] }).tasks.map((entry) => entry.id)).toEqual(['t3']);
    expect(run({ isLateOnly: true }).tasks.map((entry) => entry.id)).toEqual(['t1']);
    expect(run({ assignee: 99 }).items).toEqual([]);
  });
});
