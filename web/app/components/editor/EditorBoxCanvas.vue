<template>
  <div class="flex min-w-0 flex-col gap-2">
    <div
      ref="surface"
      class="relative w-full cursor-crosshair touch-none overflow-hidden rounded-card border border-line bg-surface shadow-card shadow-sm select-none"
      @pointerdown="handleSurfacePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
    >
      <img
        :src="image.src"
        :alt="imageAlt"
        :width="image.width"
        :height="image.height"
        draggable="false"
        class="pointer-events-none block h-auto w-full"
      />

      <button
        v-for="item in boxes"
        :key="item.key"
        type="button"
        class="absolute cursor-move rounded-control border-[3px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
        :class="item.key === selectedKey ? 'z-10 border-danger-mark bg-danger-mark/15' : 'border-danger-mark/60 bg-danger-mark/5 hover:border-danger-mark'"
        :style="toBoxStyle(item.box)"
        :aria-label="t('editor.canvas.boxLabel', { number: item.number, title: item.title || t('editor.points.untitled') })"
        :aria-pressed="item.key === selectedKey"
        @pointerdown.stop="handleBoxPointerDown($event, item, 'move')"
        @keydown="handleBoxKeydown($event, item)"
      >
        <span
          class="absolute -top-3 -left-3 grid size-7 place-items-center rounded-full text-xs font-bold tabular-nums shadow-md ring-2 ring-surface"
          :class="item.key === selectedKey ? 'bg-danger-mark text-accent-contrast' : 'bg-surface text-danger'"
          aria-hidden="true"
          >{{ item.number }}</span
        >
        <span
          v-if="item.key === selectedKey"
          class="absolute -right-2 -bottom-2 size-4 cursor-se-resize rounded-sm border-2 border-surface bg-danger-mark"
          aria-hidden="true"
          :title="t('editor.canvas.resizeHandle', { number: item.number })"
          @pointerdown.stop="handleBoxPointerDown($event, item, 'resize')"
        />
      </button>

      <span
        v-if="draftBox"
        class="pointer-events-none absolute rounded-control border-[3px] border-dashed border-accent bg-accent/10"
        :style="toBoxStyle(draftBox)"
        aria-hidden="true"
      />
    </div>
    <p class="text-sm text-content-muted">{{ t('editor.canvas.hint') }}</p>
  </div>
</template>

<script setup lang="ts">
import { type Box, boxFromDrag, KEYBOARD_STEP, moveBox, type PercentPoint, resizeBox, toPercentPoint } from '@/utils/box-geometry';
import type { ScreenImage } from '~~/shared/contracts/screen';

interface CanvasBox {
  key: string;
  number: number;
  title: string;
  box: Box;
}

type Interaction = { kind: 'draw'; start: PercentPoint } | { kind: 'move' | 'resize'; key: string; origin: PercentPoint; box: Box };

defineProps<{
  image: ScreenImage;
  imageAlt: string;
  boxes: CanvasBox[];
  selectedKey: string | null;
}>();

const emit = defineEmits<{
  create: [box: Box];
  change: [key: string, box: Box];
  select: [key: string];
  remove: [key: string];
}>();

const { t } = useI18n();
const surface = useTemplateRef<HTMLDivElement>('surface');
const interaction = shallowRef<Interaction | null>(null);
const draftBox = ref<Box | null>(null);

function toBoxStyle([left, top, width, height]: Box): Record<string, string> {
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` };
}

function pointerPercent(event: PointerEvent): PercentPoint | null {
  const element = surface.value;

  return element ? toPercentPoint(event.clientX, event.clientY, element.getBoundingClientRect()) : null;
}

// Capturing on the surface keeps the drag alive when the pointer leaves a box or the image.
function capture(event: PointerEvent): void {
  surface.value?.setPointerCapture?.(event.pointerId);
}

function handleSurfacePointerDown(event: PointerEvent): void {
  const start = event.button === 0 ? pointerPercent(event) : null;

  if (start) {
    capture(event);
    interaction.value = { kind: 'draw', start };
  }
}

function handleBoxPointerDown(event: PointerEvent, item: CanvasBox, kind: 'move' | 'resize'): void {
  const origin = event.button === 0 ? pointerPercent(event) : null;

  emit('select', item.key);

  if (origin) {
    capture(event);
    interaction.value = { kind, key: item.key, origin, box: item.box };
  }
}

function handlePointerMove(event: PointerEvent): void {
  const current = interaction.value;
  const point = current ? pointerPercent(event) : null;

  if (!current || !point) {
    return;
  }

  if (current.kind === 'draw') {
    draftBox.value = boxFromDrag(current.start, point);
    return;
  }

  const dx = point.x - current.origin.x;
  const dy = point.y - current.origin.y;

  emit('change', current.key, current.kind === 'move' ? moveBox(current.box, dx, dy) : resizeBox(current.box, dx, dy));
}

function handlePointerUp(): void {
  if (interaction.value?.kind === 'draw' && draftBox.value) {
    emit('create', draftBox.value);
  }

  handlePointerCancel();
}

function handlePointerCancel(): void {
  interaction.value = null;
  draftBox.value = null;
}

const ARROW_DELTAS: Record<string, [number, number]> = {
  ArrowLeft: [-KEYBOARD_STEP, 0],
  ArrowRight: [KEYBOARD_STEP, 0],
  ArrowUp: [0, -KEYBOARD_STEP],
  ArrowDown: [0, KEYBOARD_STEP],
};

function handleBoxKeydown(event: KeyboardEvent, item: CanvasBox): void {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    emit('remove', item.key);
    return;
  }

  const delta = ARROW_DELTAS[event.key];

  if (!delta) {
    return;
  }

  event.preventDefault();
  emit('select', item.key);
  emit('change', item.key, event.shiftKey ? resizeBox(item.box, delta[0], delta[1]) : moveBox(item.box, delta[0], delta[1]));
}
</script>
