<template>
  <section class="flex flex-col gap-2.5 rounded-card bg-surface-muted p-3">
    <div class="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        class="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-contrast"
        >{{ number }}</span
      >
      <div class="flex min-w-0 flex-col gap-0.5">
        <h3 class="text-sm font-semibold">{{ title }}</h3>
        <p
          v-if="hint"
          class="text-xs text-content-muted"
        >
          {{ hint }}
        </p>
      </div>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
// A numbered block inside the plan details panel, so each kind of information sits in its own box.
defineProps<{ number: number; title: string; hint?: string }>();
</script>
