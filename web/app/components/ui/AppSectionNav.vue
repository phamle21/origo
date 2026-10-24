<template>
  <nav
    :aria-label="label"
    class="border-b border-line bg-surface"
  >
    <ul class="flex flex-wrap gap-1 px-4 py-2 sm:px-6">
      <li
        v-for="item in items"
        :key="item.id"
      >
        <NuxtLink
          :to="item.to"
          :aria-current="item.id === current ? 'page' : undefined"
          :class="[
            'inline-flex min-h-10 items-center gap-2 rounded-control px-3.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            item.id === current ? 'bg-accent text-accent-contrast shadow-sm' : 'text-content-muted hover:bg-neutral-soft hover:text-content',
          ]"
        >
          <AppIcon :name="item.icon" />
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue';

// Second-level navigation under the action bar: one pill per section, the current one tinted.
defineProps<{
  label: string;
  items: { id: string; label: string; icon: AppIconName; to: string }[];
  current: string;
}>();
</script>
