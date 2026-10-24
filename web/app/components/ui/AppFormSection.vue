<template>
  <section class="grid grid-cols-1 gap-4 border-t border-line px-6 py-6 first:border-t-0 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
    <div class="flex items-start gap-3">
      <span
        aria-hidden="true"
        class="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-contrast"
        >{{ number }}</span
      >
      <div class="flex min-w-0 flex-col gap-1">
        <h2 class="font-semibold break-words">
          <span class="sr-only">{{ t('common.form.step', { number }) }}</span>
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
    <div class="flex min-w-0 flex-col gap-4">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
// One numbered part of a form that fits in a single card: the number and title on the left, the
// related fields on the right, stacked on narrow screens.
defineProps<{ number: number; title: string; description?: string }>();

const { t } = useI18n();
</script>
