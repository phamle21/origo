import type { PlanItem, PlanTask, PlanTaskStatus } from '~~/shared/contracts/plan';

export interface PlanFilter {
  /** Part of a phase, module or feature name. */
  query: string;
  /** A member's id, "none" for schedule entries nobody owns, or null for everyone. */
  assignee: number | 'none' | null;
  stageId: string | null;
  statuses: PlanTaskStatus[];
  /** Only entries past their end date and not done yet. */
  isLateOnly: boolean;
}

export function emptyPlanFilter(): PlanFilter {
  return { query: '', assignee: null, stageId: null, statuses: [], isLateOnly: false };
}

function hasTaskCriteria(filter: PlanFilter): boolean {
  return filter.assignee !== null || filter.stageId !== null || filter.statuses.length > 0 || filter.isLateOnly;
}

export function isPlanFilterActive(filter: PlanFilter): boolean {
  return filter.query.trim() !== '' || hasTaskCriteria(filter);
}

/**
 * What the chart and table show under a filter. Schedule entries must match every set criterion; a
 * feature stays when its name (or a parent's name) matches the search and, if entry criteria are set,
 * it keeps at least one matching entry. Phases and modules stay when something below them does; a
 * phase or module whose own name matches keeps everything under it.
 */
export function filterPlan(
  items: PlanItem[],
  tasks: PlanTask[],
  filter: PlanFilter,
  namesOf: (item: PlanItem) => string[],
  today: string,
): { items: PlanItem[]; tasks: PlanTask[] } {
  if (!isPlanFilterActive(filter)) {
    return { items, tasks };
  }

  const needle = filter.query.trim().toLowerCase();
  const byId = new Map(items.map((item) => [item.id, item]));
  const nameMatches = (item: PlanItem) => !needle || namesOf(item).some((name) => name.toLowerCase().includes(needle));
  const lineMatches = (item: PlanItem): boolean => {
    for (let current: PlanItem | undefined = item; current; current = current.parentId ? byId.get(current.parentId) : undefined) {
      if (nameMatches(current)) {
        return true;
      }
    }

    return false;
  };

  const taskMatches = (task: PlanTask) =>
    (filter.assignee === null || (filter.assignee === 'none' ? task.assigneeId === null : task.assigneeId === filter.assignee)) &&
    (filter.stageId === null || task.stageId === filter.stageId) &&
    (filter.statuses.length === 0 || filter.statuses.includes(task.status)) &&
    (!filter.isLateOnly || (task.endDate < today && task.status !== 'done'));

  const keptTasks = hasTaskCriteria(filter) ? tasks.filter(taskMatches) : tasks;
  const featuresWithTasks = new Set(keptTasks.map((task) => task.itemId));
  const kept = new Set<string>();

  for (const item of items) {
    if (item.kind === 'feature' && lineMatches(item) && (!hasTaskCriteria(filter) || featuresWithTasks.has(item.id))) {
      for (let current: PlanItem | undefined = item; current; current = current.parentId ? byId.get(current.parentId) : undefined) {
        kept.add(current.id);
      }
    }
  }

  // Without entry criteria, a phase or module found by name shows even while it has no features yet.
  if (!hasTaskCriteria(filter)) {
    for (const item of items) {
      if (item.kind !== 'feature' && lineMatches(item)) {
        for (let current: PlanItem | undefined = item; current; current = current.parentId ? byId.get(current.parentId) : undefined) {
          kept.add(current.id);
        }
      }
    }
  }

  return { items: items.filter((item) => kept.has(item.id)), tasks: keptTasks.filter((task) => kept.has(task.itemId)) };
}
