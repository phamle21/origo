import type { MaybeRefOrGetter } from 'vue';
import type { RouteResourceOptions } from '@/composables/useRouteResource';
import { fetchScreenDetail } from '@/api/screen/screen';

export function useScreenDetail(projectCode: MaybeRefOrGetter<string>, screenCode: MaybeRefOrGetter<string>, options?: RouteResourceOptions) {
  return useRouteResource(
    () => `screen-detail:${toValue(projectCode)}:${toValue(screenCode)}`,
    () => fetchScreenDetail(toValue(projectCode), toValue(screenCode)),
    options,
  );
}
