import { toDayNumber, type DayRange } from '@/utils/plan-dates';
import type { PlanItem, PlanTask } from '~~/shared/contracts/plan';

export interface PlanRow {
  item: PlanItem;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  /** Feature rows: their own tasks. Phase and module rows: none (they show a summary bar). */
  tasks: PlanTask[];
  /** First start to last end of this row and everything below it; null while nothing is scheduled. */
  span: DayRange | null;
  taskCount: number;
  doneCount: number;
}

interface Totals {
  span: DayRange | null;
  taskCount: number;
  doneCount: number;
}

function mergeSpan(left: DayRange | null, right: DayRange | null): DayRange | null {
  if (!left || !right) {
    return left ?? right;
  }

  return { start: Math.min(left.start, right.start), end: Math.max(left.end, right.end) };
}

/** Everything scheduled under this row is done (a row with nothing scheduled is not "done"). */
export function isRowDone(row: Pick<PlanRow, 'taskCount' | 'doneCount'>): boolean {
  return row.taskCount > 0 && row.doneCount === row.taskCount;
}

export function taskRange(task: Pick<PlanTask, 'startDate' | 'endDate'>): DayRange {
  return { start: toDayNumber(task.startDate), end: toDayNumber(task.endDate) };
}

/**
 * Flattens the phase → module → feature tree into display rows, depth first and in `position` order.
 * Children of a collapsed row are left out, but still count towards its summary bar and progress.
 */
export function buildPlanRows(items: PlanItem[], tasks: PlanTask[], collapsedIds: ReadonlySet<string> = new Set()): PlanRow[] {
  const childrenByParent = new Map<string | null, PlanItem[]>();
  const tasksByItem = new Map<string, PlanTask[]>();

  for (const item of items) {
    const siblings = childrenByParent.get(item.parentId) ?? [];

    siblings.push(item);
    childrenByParent.set(item.parentId, siblings);
  }
  for (const siblings of childrenByParent.values()) {
    siblings.sort((left, right) => left.position - right.position);
  }
  for (const task of tasks) {
    const own = tasksByItem.get(task.itemId) ?? [];

    own.push(task);
    tasksByItem.set(task.itemId, own);
  }

  const rows: PlanRow[] = [];

  function visit(item: PlanItem, depth: number, isVisible: boolean): Totals {
    const children = childrenByParent.get(item.id) ?? [];
    const own = tasksByItem.get(item.id) ?? [];
    const isCollapsed = collapsedIds.has(item.id);
    const row: PlanRow = {
      item,
      depth,
      hasChildren: children.length > 0,
      isCollapsed,
      tasks: item.kind === 'feature' ? own : [],
      span: null,
      taskCount: 0,
      doneCount: 0,
    };

    if (isVisible) {
      rows.push(row);
    }

    let totals: Totals = {
      span: own.reduce<DayRange | null>((span, task) => mergeSpan(span, taskRange(task)), null),
      taskCount: own.length,
      doneCount: own.filter((task) => task.status === 'done').length,
    };

    for (const child of children) {
      const childTotals = visit(child, depth + 1, isVisible && !isCollapsed);

      totals = {
        span: mergeSpan(totals.span, childTotals.span),
        taskCount: totals.taskCount + childTotals.taskCount,
        doneCount: totals.doneCount + childTotals.doneCount,
      };
    }

    Object.assign(row, totals);

    return totals;
  }

  for (const root of childrenByParent.get(null) ?? []) {
    visit(root, 0, true);
  }

  return rows;
}

/**
 * Stacks overlapping bars of one row into lanes, earliest start first, so two stages that run at the
 * same time are both visible.
 */
export function assignLanes(ranges: { id: string; range: DayRange }[]): { lanes: Map<string, number>; laneCount: number } {
  const laneEnds: number[] = [];
  const lanes = new Map<string, number>();

  for (const { id, range } of [...ranges].sort((left, right) => left.range.start - right.range.start)) {
    let lane = laneEnds.findIndex((end) => end < range.start);

    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(range.end);
    } else {
      laneEnds[lane] = range.end;
    }

    lanes.set(id, lane);
  }

  return { lanes, laneCount: Math.max(1, laneEnds.length) };
}
