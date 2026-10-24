import { getApiErrorMessageKey, toApiErrorData } from '@/api/client';
import type { ApiErrorData } from '~~/shared/contracts/api-error';

export const ERROR_PRESENTATIONS = ['inline', 'toast', 'dialog', 'page', 'silent'] as const;

export type ErrorPresentation = (typeof ERROR_PRESENTATIONS)[number];

export interface UseAppRequestOptions {
  /** How the caller renders a failure. The server error policy stays independent of this choice. */
  presentation?: ErrorPresentation;
}

/**
 * Runs an event-driven `app/api` operation and exposes its pending, failed, and success states with a
 * localized message. Render-critical reads use `useAsyncData` instead, so this never owns SSR data.
 * A superseded call is ignored: only the newest execution may write the returned state.
 */
export function useAppRequest<TResult, TArguments extends unknown[]>(operation: (...args: TArguments) => Promise<TResult>, options: UseAppRequestOptions = {}) {
  const { t } = useI18n();
  const data = shallowRef<TResult | null>(null);
  const error = shallowRef<ApiErrorData | null>(null);
  const isPending = ref(false);
  const hasFailed = ref(false);

  let latestExecutionId = 0;

  async function execute(...args: TArguments): Promise<TResult | null> {
    const executionId = ++latestExecutionId;

    isPending.value = true;
    hasFailed.value = false;
    error.value = null;

    try {
      const result = await operation(...args);

      if (executionId !== latestExecutionId) {
        return null;
      }

      data.value = result;

      return result;
    } catch (cause) {
      if (executionId === latestExecutionId) {
        error.value = toApiErrorData(cause);
        hasFailed.value = true;
      }

      return null;
    } finally {
      if (executionId === latestExecutionId) {
        isPending.value = false;
      }
    }
  }

  function reset(): void {
    latestExecutionId += 1;
    data.value = null;
    error.value = null;
    hasFailed.value = false;
    isPending.value = false;
  }

  return {
    data,
    error,
    errorMessage: computed(() => (hasFailed.value ? t(getApiErrorMessageKey(error.value)) : '')),
    fieldErrors: computed(() => error.value?.fields ?? null),
    hasFailed,
    isPending,
    presentation: options.presentation ?? 'inline',
    execute,
    reset,
  };
}
