import { defineStore } from 'pinia';

export interface ConfirmRequest {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'default' | 'danger';
}

/**
 * One confirmation dialog for the whole app (mounted once in the layout), so every "are you sure"
 * looks the same instead of the browser's own `window.confirm`. `confirm()` resolves true when the
 * person confirms, false when they cancel, press Escape or another request replaces it.
 */
export const useConfirmStore = defineStore('confirm-dialog', () => {
  const request = shallowRef<ConfirmRequest | null>(null);
  // Lives in this store instance (one per SSR request), never at module scope.
  let resolveActive: ((isConfirmed: boolean) => void) | null = null;

  function confirm(next: ConfirmRequest): Promise<boolean> {
    resolveActive?.(false);

    return new Promise((resolve) => {
      resolveActive = resolve;
      request.value = next;
    });
  }

  function settle(isConfirmed: boolean): void {
    resolveActive?.(isConfirmed);
    resolveActive = null;
    request.value = null;
  }

  return { request, confirm, settle };
});
