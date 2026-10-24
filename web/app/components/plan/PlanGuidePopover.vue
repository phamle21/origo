<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      ref="trigger"
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      class="flex min-h-9 items-center gap-1.5 rounded-control px-2.5 text-sm font-semibold text-info hover:bg-info-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      @click="toggle"
    >
      <AppIcon
        name="info"
        :size="16"
      />
      {{ t('plan.guide.button') }}
    </button>
    <div
      v-if="isOpen"
      :id="panelId"
      class="absolute top-full right-0 z-30 mt-2 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm shadow-2xl"
    >
      <p class="font-semibold text-info">{{ t('plan.guide.title') }}</p>
      <ol class="flex flex-col gap-2.5">
        <li
          v-for="tip in TIPS"
          :key="tip.key"
          class="flex items-start gap-2.5"
        >
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-info-soft text-xs font-bold text-info">
            <AppIcon
              v-if="tip.icon"
              :name="tip.icon"
              :size="14"
            />
            <template v-else>‖</template>
          </span>
          {{ t(`plan.guide.${tip.key}`) }}
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue';

// How to change the schedule, folded behind one button so the chart keeps the room.
const TIPS: { key: string; icon: AppIconName | null }[] = [
  { key: 'move', icon: 'move' },
  { key: 'resize', icon: null },
  { key: 'edit', icon: 'pencil' },
  { key: 'reorder', icon: 'grip' },
];

const { t } = useI18n();
const panelId = useId();
const root = useTemplateRef<HTMLElement>('root');
const trigger = useTemplateRef<HTMLElement>('trigger');
const { isOpen, toggle } = useDropdown(root, trigger);
</script>
