<template>
  <NuxtLink
    :to="to"
    class="inline-flex items-center gap-2.5 rounded-control text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    :aria-label="t('layout.homeLink', { appName })"
  >
    <!-- Brand mark: the "O" of Origo with a marker point breaking out of it, like a numbered point on a screen. -->
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      aria-hidden="true"
      class="shrink-0 text-accent"
    >
      <rect
        width="32"
        height="32"
        rx="8"
        fill="currentColor"
      />
      <circle
        cx="14.5"
        cy="17.5"
        r="8"
        fill="none"
        stroke="#ffffff"
        stroke-width="3.5"
      />
      <circle
        cx="23.5"
        cy="8.5"
        r="5.75"
        fill="currentColor"
      />
      <circle
        cx="23.5"
        cy="8.5"
        r="4"
        fill="#fbbf24"
      />
    </svg>
    <span class="text-xl font-bold tracking-tight">{{ appName }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ to: string }>();

const { t } = useI18n();
const appName = useRuntimeConfig().public.appName;
</script>
