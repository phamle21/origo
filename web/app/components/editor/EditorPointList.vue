<template>
  <section class="flex flex-col gap-2">
    <h2 class="text-sm font-semibold">{{ t('editor.points.heading') }}</h2>
    <p
      v-if="!points.length"
      class="text-sm text-content-muted"
    >
      {{ t('editor.points.empty') }}
    </p>
    <ol
      v-else
      class="flex flex-col gap-1"
    >
      <li
        v-for="(point, index) in points"
        :key="point.key"
        class="flex items-center gap-1 rounded-control"
        :class="point.key === selectedKey ? 'bg-danger-soft' : ''"
      >
        <button
          type="button"
          class="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-control px-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-accent"
          :aria-pressed="point.key === selectedKey"
          @click="emit('select', point.key)"
        >
          <span
            class="grid size-7 shrink-0 place-items-center rounded-full bg-danger-mark text-xs font-bold text-accent-contrast tabular-nums"
            aria-hidden="true"
            >{{ index + 1 }}</span
          >
          <span
            class="min-w-0 break-words"
            :class="point.title ? 'font-medium' : 'text-content-muted italic'"
            >{{ point.title || t('editor.points.untitled') }}</span
          >
        </button>
        <button
          type="button"
          class="grid size-9 shrink-0 place-items-center rounded-control text-content-muted hover:bg-surface hover:text-content disabled:opacity-30"
          :disabled="index === 0"
          :aria-label="t('editor.actions.moveUp', { number: index + 1 })"
          @click="emit('move', index, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          class="grid size-9 shrink-0 place-items-center rounded-control text-content-muted hover:bg-surface hover:text-content disabled:opacity-30"
          :disabled="index === points.length - 1"
          :aria-label="t('editor.actions.moveDown', { number: index + 1 })"
          @click="emit('move', index, 1)"
        >
          ↓
        </button>
        <button
          type="button"
          class="grid size-9 shrink-0 place-items-center rounded-control text-danger hover:bg-danger-soft"
          :aria-label="t('editor.actions.remove', { number: index + 1 })"
          @click="emit('remove', point.key)"
        >
          ✕
        </button>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  points: { key: string; title: string }[];
  selectedKey: string | null;
}>();

const emit = defineEmits<{
  select: [key: string];
  move: [index: number, offset: number];
  remove: [key: string];
}>();

const { t } = useI18n();
</script>
