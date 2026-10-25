import type { PlanStatus, PlanTask, PlanTaskStatus } from '~~/shared/contracts/plan';

export const PLAN_STATUS_CATEGORIES: PlanTaskStatus[] = ['todo', 'doing', 'done'];

/**
 * The status a task shows: the project status it carries, or the first one of its category (a task saved
 * before the project named its statuses).
 */
export function statusOfTask(task: Pick<PlanTask, 'status' | 'statusId'>, statuses: PlanStatus[]): PlanStatus | null {
  return statuses.find((status) => status.id === task.statusId) ?? statuses.find((status) => status.category === task.status) ?? null;
}

/** Share of a task that is finished, 0–1: done counts as all of it, otherwise its progress. */
export function doneShare(task: Pick<PlanTask, 'status' | 'progress'>): number {
  return task.status === 'done' ? 1 : Math.min(100, Math.max(0, task.progress ?? 0)) / 100;
}
