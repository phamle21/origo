<template>
  <nav
    :aria-label="t('layout.language')"
    class="flex items-center gap-0.5 rounded-control bg-neutral-soft p-1"
  >
    <NuxtLink
      v-for="option in options"
      :key="option.code"
      :to="option.to"
      :lang="option.code"
      :aria-current="option.code === current ? 'true' : undefined"
      class="inline-flex min-h-9 items-center rounded-control px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent"
      :class="option.code === current ? 'bg-accent font-semibold text-accent-contrast shadow-sm' : 'text-content hover:bg-surface hover:text-accent-strong'"
      >{{ LANGUAGE_AUTONYMS[option.code] }}</NuxtLink
    >
  </nav>
</template>

<script setup lang="ts">
import { LANGUAGE_AUTONYMS } from '@/utils/content-language';

defineProps<{
  options: { code: 'vi' | 'ja' | 'en'; to: string }[];
  current: string;
}>();

const { t } = useI18n();
</script>
