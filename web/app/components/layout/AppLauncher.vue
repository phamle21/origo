<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      ref="trigger"
      type="button"
      class="flex size-10 items-center justify-center rounded-control text-content-muted hover:bg-surface-muted hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      :aria-label="t('layout.launcher.open')"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      @click="toggle"
    >
      <AppIcon
        name="grid"
        :size="20"
      />
    </button>
    <nav
      v-show="isOpen"
      :id="panelId"
      :aria-label="t('layout.launcher.label')"
      class="absolute top-full left-0 z-40 mt-2 w-max rounded-card border border-line bg-surface p-3 shadow-lg"
    >
      <ul :class="['grid gap-2', apps.length > 2 ? 'grid-cols-[repeat(3,7rem)]' : 'grid-cols-[repeat(2,7rem)]']">
        <li
          v-for="app in apps"
          :key="app.id"
        >
          <NuxtLink
            :to="app.to"
            :aria-current="app.id === current ? 'page' : undefined"
            :class="[
              'flex w-full flex-col items-center gap-2 rounded-card px-2 py-3 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              app.id === current ? 'bg-accent text-accent-contrast shadow-sm' : 'text-content hover:bg-neutral-soft',
            ]"
          >
            <AppTileIcon
              :name="app.tile"
              size="lg"
            />
            {{ app.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import AppTileIcon, { type AppTileIconName } from '@/components/ui/AppTileIcon.vue';
import type { AppSection } from '@/utils/app-sections';

defineProps<{
  apps: { id: AppSection; label: string; tile: AppTileIconName; to: string }[];
  current: AppSection;
}>();

const { t } = useI18n();
const panelId = useId();
const root = useTemplateRef<HTMLElement>('root');
const trigger = useTemplateRef<HTMLElement>('trigger');
const { isOpen, toggle } = useDropdown(root, trigger);
</script>
