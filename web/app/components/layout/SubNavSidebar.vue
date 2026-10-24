<template>
  <aside class="shrink-0 border-b border-line-strong bg-surface lg:w-64 lg:border-r lg:border-b-0">
    <nav
      :aria-label="groups[0]?.title"
      class="flex gap-4 overflow-x-auto px-3 py-3 lg:sticky lg:top-0 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-3 lg:py-6"
    >
      <div
        v-for="group in groups"
        :key="group.id"
        class="flex shrink-0 flex-col gap-1"
      >
        <p class="px-3 text-xs font-semibold tracking-wide text-content-muted uppercase">{{ group.title }}</p>
        <ul class="flex gap-1 lg:flex-col">
          <li
            v-for="item in group.items"
            :key="item.path"
          >
            <NuxtLink
              :to="item.to"
              :aria-current="item.isActive ? 'page' : undefined"
              :class="[
                'flex min-h-9 items-center gap-2.5 rounded-control px-3 text-sm font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                item.isActive ? 'bg-accent text-accent-contrast shadow-sm' : 'text-content-muted hover:bg-neutral-soft hover:text-content',
              ]"
            >
              <AppIcon
                :name="item.icon"
                :size="16"
              />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue';

export interface SubNavGroup {
  id: string;
  /** The header item these pages belong to, e.g. "System access". */
  title: string;
  items: { label: string; icon: AppIconName; path: string; to: string; isActive: boolean }[];
}

// The sub-pages of the open header item: a sidebar on wide screens, one scrolling row on narrow ones.
defineProps<{ groups: SubNavGroup[] }>();
</script>
