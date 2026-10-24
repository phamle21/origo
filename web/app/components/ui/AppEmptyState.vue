<template>
  <div class="flex flex-col items-center gap-2 rounded-card border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
    <p class="text-sm font-semibold break-words">{{ title }}</p>
    <p
      v-if="description"
      class="max-w-md text-sm break-words text-content-muted"
    >
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>
