<template>
  <div
    role="group"
    :aria-label="label"
    class="flex flex-wrap gap-2"
  >
    <button
      v-for="point in points"
      :key="point.number"
      type="button"
      class="inline-flex min-h-10 max-w-full items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      :class="point.number === selectedNumber ? 'border-danger-mark bg-danger-soft font-semibold' : 'border-line bg-surface hover:border-danger-mark'"
      :aria-pressed="point.number === selectedNumber"
      @click="emit('select', point.number)"
    >
      <span
        class="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums"
        :class="point.number === selectedNumber ? 'bg-danger-mark text-accent-contrast' : 'bg-danger-soft text-danger'"
        aria-hidden="true"
        >{{ point.number }}</span
      >
      <AppLocalizedText
        :text="point.title"
        class="min-w-0"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import type { ScreenPoint } from '~~/shared/contracts/screen';

defineProps<{
  points: Pick<ScreenPoint, 'number' | 'title'>[];
  selectedNumber: number | null;
  label: string;
}>();

const emit = defineEmits<{ select: [number: number] }>();
</script>
