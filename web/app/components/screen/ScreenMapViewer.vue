<template>
  <figure class="m-0 flex min-w-0 flex-col gap-2">
    <div class="relative w-full overflow-hidden rounded-card border border-line bg-surface shadow-card shadow-sm">
      <img
        :src="image.src"
        :alt="imageAlt"
        :width="image.width"
        :height="image.height"
        class="block h-auto w-full"
      />
      <button
        v-for="point in points"
        :key="point.number"
        type="button"
        class="group absolute rounded-control border-[3px] transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
        :class="
          point.number === selectedNumber ? 'border-danger-mark bg-danger-mark/10' : 'border-danger-mark/60 hover:border-danger-mark hover:bg-danger-mark/5'
        "
        :style="toBoxStyle(point.box)"
        :aria-label="t('screen.detail.pointButton', { number: point.number, title: resolveLocalizedText(point.title, language.primary).value })"
        :aria-pressed="point.number === selectedNumber"
        @click="emit('select', point.number)"
      >
        <span
          class="absolute -top-3 -left-3 grid size-7 place-items-center rounded-full text-xs font-bold tabular-nums shadow-md ring-2 ring-surface"
          :class="
            point.number === selectedNumber
              ? 'bg-danger-mark text-accent-contrast'
              : 'bg-surface text-danger group-hover:bg-danger-mark group-hover:text-accent-contrast'
          "
          aria-hidden="true"
          >{{ point.number }}</span
        >
      </button>
    </div>
    <figcaption
      v-if="caption"
      class="text-sm text-content-muted"
    >
      {{ caption }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { CONTENT_LANGUAGE_KEY, DEFAULT_CONTENT_VIEW, resolveLocalizedText } from '@/utils/content-language';
import type { ScreenImage, ScreenPoint } from '~~/shared/contracts/screen';

defineProps<{
  image: ScreenImage;
  imageAlt: string;
  points: Pick<ScreenPoint, 'number' | 'title' | 'box'>[];
  selectedNumber: number | null;
  caption?: string;
}>();

const emit = defineEmits<{ select: [number: number] }>();

const { t } = useI18n();
const injected = inject(CONTENT_LANGUAGE_KEY, null);
const language = computed(() => injected?.value ?? DEFAULT_CONTENT_VIEW);

// Boxes are stored in percent of the image so they stay aligned at every rendered width.
function toBoxStyle([left, top, width, height]: ScreenPoint['box']): Record<string, string> {
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` };
}
</script>
