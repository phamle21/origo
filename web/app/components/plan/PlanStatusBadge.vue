<template>
  <span
    class="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
    :style="{
      borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
      backgroundColor: `color-mix(in srgb, ${color} 14%, var(--app-color-surface))`,
    }"
  >
    <span
      aria-hidden="true"
      class="size-2 shrink-0 rounded-full"
      :style="{ backgroundColor: color }"
    />
    <span class="truncate">{{ category === 'done' ? '✓ ' : '' }}{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { resolveLocalizedText } from '@/utils/content-language';
import type { PlanStatus, PlanTaskStatus } from '~~/shared/contracts/plan';

/** A task's status in the project's own name and colour; falls back to the category's name. */
const FALLBACK_COLORS = { todo: '#94a3b8', doing: '#2563eb', done: '#16a34a' } as const;

const props = defineProps<{ status: PlanStatus | null; category: PlanTaskStatus; language: string }>();

const { t } = useI18n();
const color = computed(() => props.status?.color ?? FALLBACK_COLORS[props.category]);
const label = computed(() => (props.status ? resolveLocalizedText(props.status.name, props.language).value : t(`plan.status.${props.category}`)));
</script>
