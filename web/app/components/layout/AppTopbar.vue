<template>
  <header class="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line-strong bg-toolbar px-4 py-3 shadow-sm sm:px-6">
    <nav
      :aria-label="t('layout.breadcrumb')"
      class="min-w-0"
    >
      <ol class="flex flex-wrap items-center gap-1.5 text-sm text-content-muted">
        <li
          v-for="(crumb, index) in crumbs"
          :key="`${index}-${crumb.label}`"
          class="flex min-w-0 items-center gap-1.5"
        >
          <AppIcon
            v-if="index > 0"
            name="chevronRight"
            :size="14"
          />
          <NuxtLink
            v-if="crumb.to"
            :to="crumb.to"
            class="break-words text-accent hover:text-accent-strong"
            >{{ crumb.label }}</NuxtLink
          >
          <span
            v-else
            class="font-medium break-words text-content"
            aria-current="page"
            >{{ crumb.label }}</span
          >
        </li>
        <li
          v-if="$slots.trail"
          class="flex min-w-0 items-center gap-1.5"
        >
          <AppIcon
            name="chevronRight"
            :size="14"
          />
          <slot name="trail" />
        </li>
      </ol>
    </nav>
    <div
      v-if="$slots.default"
      class="flex flex-wrap items-center gap-3"
    >
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

defineProps<{ crumbs: { label: string; to?: string }[] }>();

const { t } = useI18n();
</script>
