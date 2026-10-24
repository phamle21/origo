import type { MaybeRefOrGetter } from 'vue';
import { getApiErrorMessageKey, toApiErrorData } from '@/api/client';
import { isMissingPageError } from '@/utils/missing-page';

export interface RouteResourceOptions {
  /**
   * Waits for the data before the page opens. Only for pages that read the data once while setting up
   * (a form draft, a permission redirect); every other page opens at once and shows a skeleton.
   */
  isBlocking?: boolean;
}

/**
 * Render-critical read for a resource addressed by the route. The server always waits for it, so a
 * missing resource renders the error page with a real 404 status; in the browser the page opens at once
 * (`isPending` drives its skeleton) unless `isBlocking` is set. Any other failure stays inline with a
 * retry. Callers pass a stable key per resource because Nuxt shares state between matching keys.
 */
export async function useRouteResource<TData>(key: MaybeRefOrGetter<string>, load: () => Promise<TData>, options: RouteResourceOptions = {}) {
  const { t } = useI18n();
  const { data, error, status, refresh } = await useAsyncData(key, load, { lazy: import.meta.client && !options.isBlocking });
  const apiError = computed(() => toApiErrorData(error.value));

  if (isMissingPageError(apiError.value)) {
    throw createError({ statusCode: 404, fatal: true });
  }

  // A lazy read finds out it is missing only after the page opened.
  if (import.meta.client && !options.isBlocking) {
    watch(apiError, (value) => {
      if (isMissingPageError(value)) {
        showError(createError({ statusCode: 404, fatal: true }));
      }
    });
  }

  return {
    data: computed(() => data.value ?? null),
    isPending: computed(() => status.value === 'pending'),
    hasFailed: computed(() => status.value === 'error'),
    errorMessage: computed(() => (status.value === 'error' ? t(getApiErrorMessageKey(apiError.value)) : '')),
    refresh,
  };
}
