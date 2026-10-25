import type { MaybeRefOrGetter } from 'vue';
import { fetchPlanWeekly } from '@/api/plan/plan';

/** The weekly report of a project's plan: frozen progress per week, hours and summaries. */
export function usePlanWeekly(projectCode: MaybeRefOrGetter<string>) {
  return useRouteResource(
    () => `project-plan-weekly:${toValue(projectCode)}`,
    () => fetchPlanWeekly(toValue(projectCode)),
  );
}
