import type { MaybeRefOrGetter } from 'vue';
import type { RouteResourceOptions } from '@/composables/useRouteResource';
import { fetchProjectScreens } from '@/api/screen/screen';

/** Shared by the screen list and the screen page; the matching key makes them one request. */
export function useProjectScreens(projectCode: MaybeRefOrGetter<string>, options?: RouteResourceOptions) {
  return useRouteResource(
    () => `project-screens:${toValue(projectCode)}`,
    () => fetchProjectScreens(toValue(projectCode)),
    options,
  );
}
