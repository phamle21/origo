import type { Ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';
import { useConfirmStore } from '@/stores/useConfirmStore';

/**
 * Guards a form with unsaved changes: asks before leaving the page inside the app, and lets the
 * browser warn on reload or tab close. `allowLeave` skips the question for a navigation the page
 * makes itself, such as moving to a record it has just saved.
 */
export function useUnsavedChanges(isDirty: Readonly<Ref<boolean>>, options: { allowLeave?: (to: RouteLocationNormalized) => boolean } = {}) {
  const { t } = useI18n();

  onBeforeRouteLeave((to) => {
    if (!isDirty.value || options.allowLeave?.(to)) {
      return true;
    }

    return useConfirmStore().confirm({
      title: t('common.unsaved.leaveTitle'),
      description: t('common.unsaved.leaveDescription'),
      confirmLabel: t('common.unsaved.confirmDiscard'),
      cancelLabel: t('common.unsaved.keepEditing'),
      tone: 'danger',
    });
  });

  function handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (isDirty.value) {
      event.preventDefault();
      // Older browsers only prompt when returnValue is set; the text itself is ignored.
      event.returnValue = '';
    }
  }

  onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
  onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload));
}

/** Asks a yes/no question in the app's own dialog; resolves true on confirm. */
export function useConfirm() {
  const store = useConfirmStore();
  const { t } = useI18n();

  return (title: string, options: { description?: string; confirmLabel?: string; tone?: 'default' | 'danger' } = {}) =>
    store.confirm({
      title,
      description: options.description,
      confirmLabel: options.confirmLabel ?? t('common.actions.confirm'),
      cancelLabel: t('common.actions.cancel'),
      tone: options.tone ?? 'default',
    });
}
