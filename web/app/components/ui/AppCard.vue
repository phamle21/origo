<template>
  <section class="min-w-0 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
    <div
      v-if="title || $slots.aside"
      class="mb-3 flex flex-wrap items-baseline justify-between gap-2"
    >
      <h2
        v-if="title"
        class="text-base font-semibold break-words"
      >
        {{ title }}
      </h2>
      <slot name="aside" />
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>();
</script>
