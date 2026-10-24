import type { MaybeRefOrGetter } from 'vue';
import { fetchProjectPlan } from '@/api/plan/plan';

export function useProjectPlan(projectCode: MaybeRefOrGetter<string>) {
  return useRouteResource(
    () => `project-plan:${toValue(projectCode)}`,
    () => fetchProjectPlan(toValue(projectCode)),
  );
}
