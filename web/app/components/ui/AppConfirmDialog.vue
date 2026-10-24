<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    :aria-describedby="request?.description ? descriptionId : undefined"
    class="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0 text-content shadow-2xl backdrop:bg-black/50"
    @cancel.prevent="store.settle(false)"
  >
    <div
      v-if="request"
      class="flex flex-col gap-5 p-6"
    >
      <div class="flex items-start gap-3">
        <span
          :class="[
            'flex size-10 shrink-0 items-center justify-center rounded-full',
            request.tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info',
          ]"
        >
          <AppIcon :name="request.tone === 'danger' ? 'trash' : 'info'" />
        </span>
        <div class="flex min-w-0 flex-col gap-1">
          <h2
            :id="titleId"
            class="text-lg font-semibold break-words"
          >
            {{ request.title }}
          </h2>
          <p
            v-if="request.description"
            :id="descriptionId"
            class="text-sm text-content-muted"
          >
            {{ request.description }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap justify-end gap-2">
        <AppButton
          ref="cancelButton"
          variant="secondary"
          @click="store.settle(false)"
          >{{ request.cancelLabel }}</AppButton
        >
        <button
          type="button"
          :class="[
            'inline-flex min-h-10 items-center rounded-control px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            request.tone === 'danger' ? 'bg-danger text-surface hover:opacity-90' : 'bg-accent text-accent-contrast hover:bg-accent-strong',
          ]"
          @click="store.settle(true)"
        >
          {{ request.confirmLabel }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { useConfirmStore } from '@/stores/useConfirmStore';

// A native modal dialog: it traps focus, closes on Escape and returns focus to where it was opened.
const store = useConfirmStore();
const request = computed(() => store.request);
const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const titleId = useId();
const descriptionId = useId();

watch(request, async (value) => {
  await nextTick();

  if (value && !dialog.value?.open) {
    dialog.value?.showModal();
  } else if (!value && dialog.value?.open) {
    dialog.value.close();
  }
});
</script>
