<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="m-auto max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-line bg-surface p-0 text-content shadow-2xl backdrop:bg-black/50"
    @cancel.prevent="requestClose"
  >
    <div
      v-if="open"
      class="flex max-h-[calc(100dvh-2rem)] flex-col"
    >
      <header class="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div class="flex min-w-0 items-start gap-3">
          <span
            v-if="icon"
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong"
          >
            <AppIcon :name="icon" />
          </span>
          <div class="flex min-w-0 flex-col gap-1">
            <h2
              :id="titleId"
              class="text-lg font-semibold break-words"
            >
              {{ title }}
            </h2>
            <p
              v-if="description"
              class="text-sm text-content-muted"
            >
              {{ description }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="flex size-9 shrink-0 items-center justify-center rounded-control text-content-muted hover:bg-neutral-soft hover:text-content focus-visible:outline-2 focus-visible:outline-accent"
          :aria-label="t('common.actions.close')"
          @click="requestClose"
        >
          ✕
        </button>
      </header>
      <div class="overflow-y-auto px-6 py-5">
        <slot />
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue';

/**
 * A modal dialog for a self-contained form. Closing it (Escape, ✕) with unsaved input asks first, the
 * same way leaving a page does.
 */
const props = defineProps<{ open: boolean; title: string; description?: string; icon?: AppIconName; isDirty?: boolean }>();

const emit = defineEmits<{ 'update:open': [isOpen: boolean] }>();

const { t } = useI18n();
const confirm = useConfirm();
const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const titleId = useId();

watch(
  () => props.open,
  async (isOpen) => {
    await nextTick();

    if (isOpen && !dialog.value?.open) {
      dialog.value?.showModal();
    } else if (!isOpen && dialog.value?.open) {
      dialog.value.close();
    }
  },
  { immediate: true },
);

async function requestClose(): Promise<void> {
  if (
    props.isDirty &&
    !(await confirm(t('common.unsaved.closeTitle'), {
      description: t('common.unsaved.closeDescription'),
      confirmLabel: t('common.unsaved.confirmDiscard'),
      tone: 'danger',
    }))
  ) {
    return;
  }

  emit('update:open', false);
}
</script>
