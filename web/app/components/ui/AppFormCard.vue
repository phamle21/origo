<template>
  <form
    :id="formId"
    novalidate
    class="flex w-full max-w-5xl flex-col rounded-card border border-line bg-surface shadow-card"
    @submit.prevent="emit('submit')"
  >
    <header class="flex items-start gap-4 border-b border-line px-6 py-5">
      <AppTileIcon
        v-if="tile"
        :name="tile"
      />
      <div class="flex min-w-0 flex-col gap-1">
        <h1 class="text-2xl font-bold tracking-tight break-words">{{ title }}</h1>
        <p
          v-if="description"
          class="text-sm text-content-muted"
        >
          {{ description }}
        </p>
      </div>
    </header>

    <slot />

    <p
      v-if="error"
      role="alert"
      class="mx-6 mb-4 rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>

    <footer class="flex flex-wrap items-center justify-between gap-3 rounded-b-card border-t border-line bg-surface-muted px-6 py-4">
      <span class="text-xs text-content-muted"><span class="text-danger">*</span> {{ t('common.form.requiredNote') }}</span>
      <div class="flex flex-wrap gap-2">
        <slot name="actions" />
      </div>
    </footer>
  </form>
</template>

<script setup lang="ts">
import AppTileIcon, { type AppTileIconName } from '@/components/ui/AppTileIcon.vue';

/**
 * One frame for a whole form: a header, numbered sections (AppFormSection) and a footer with the
 * actions, so a form that fits on a screen is read and filled top to bottom in a single card.
 * Browser validation is off (`novalidate`); the page checks fields with useFormValidation.
 */
defineProps<{ formId: string; title: string; description?: string; tile?: AppTileIconName; error?: string }>();

const emit = defineEmits<{ submit: [] }>();

const { t } = useI18n();
</script>
