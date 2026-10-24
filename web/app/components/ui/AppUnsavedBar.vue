<template>
  <Transition
    enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
    enter-from-class="translate-y-3 opacity-0"
    leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
    leave-to-class="translate-y-3 opacity-0"
  >
    <div
      v-if="show"
      class="sticky bottom-4 z-30"
    >
      <div
        role="status"
        class="flex flex-col gap-3 rounded-card bg-content px-4 py-3 text-surface shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:px-5"
      >
        <div class="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            class="size-2.5 shrink-0 rounded-full bg-spark"
          />
          <div class="min-w-0">
            <p class="text-sm font-semibold">{{ t('common.unsaved.title') }}</p>
            <p class="text-xs opacity-75">{{ hint ?? t('common.unsaved.hint') }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control px-4 text-sm font-semibold hover:bg-surface/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface disabled:opacity-50"
            :disabled="isSaving"
            @click="emit('discard')"
          >
            <AppIcon
              name="undo"
              :size="16"
            />
            {{ t('common.unsaved.discard') }}
          </button>
          <button
            :type="form ? 'submit' : 'button'"
            :form="form"
            class="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control bg-accent px-4 text-sm font-semibold text-accent-contrast hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface disabled:opacity-60"
            :disabled="isSaving"
            @click="form ? undefined : emit('save')"
          >
            <AppIcon
              name="check"
              :size="16"
            />
            {{ isSaving ? t('common.actions.saving') : t('common.unsaved.save') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

/**
 * Floating reminder at the bottom of a form with unsaved changes, offering Undo and Save. Save
 * submits the page's `<form id>` when `form` is given (so validation runs), otherwise emits `save`.
 */
defineProps<{ show: boolean; isSaving?: boolean; form?: string; hint?: string }>();

const emit = defineEmits<{ discard: []; save: [] }>();

const { t } = useI18n();
</script>
