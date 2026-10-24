import type { MaybeRefOrGetter } from 'vue';
import { fetchProjectMembers } from '@/api/team/team';

export function useProjectMembers(projectCode: MaybeRefOrGetter<string>) {
  return useRouteResource(
    () => `project-members:${toValue(projectCode)}`,
    () => fetchProjectMembers(toValue(projectCode)),
  );
}
