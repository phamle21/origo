<template>
  <span
    aria-hidden="true"
    class="flex shrink-0 items-center justify-center rounded-full bg-neutral-soft font-bold text-content"
    :class="size === 'sm' ? 'size-7 text-[11px]' : 'size-8 text-xs'"
    >{{ initials }}</span
  >
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    initials: string;
    size?: 'sm' | 'md';
  }>(),
  { size: 'md' },
);
</script>
