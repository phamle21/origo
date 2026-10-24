<template>
  <span
    class="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold break-words"
    :class="isDashed ? 'border border-dashed border-content-muted text-neutral' : TONE_CLASSES[tone]"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
type BadgeTone = 'neutral' | 'accent' | 'info' | 'warning' | 'success' | 'danger';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-soft text-neutral',
  accent: 'bg-accent-soft text-accent-strong',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
};

withDefaults(
  defineProps<{
    tone?: BadgeTone;
    isDashed?: boolean;
  }>(),
  { tone: 'neutral', isDashed: false },
);
</script>
