<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      ref="trigger"
      type="button"
      :aria-label="label"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :title="label"
      class="flex min-h-10 items-center gap-2 rounded-control border border-line-strong bg-surface py-1 pr-2 pl-1 text-xs font-semibold text-content-muted hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      @click="openPanel"
    >
      <span
        aria-hidden="true"
        class="size-7 rounded-full shadow-inner ring-1 ring-black/10"
        :style="{ backgroundColor: modelValue }"
      />
      <AppIcon
        name="chevronDown"
        :size="14"
      />
    </button>
    <!-- Fixed, not absolute, so a scrolling dialog cannot clip it. -->
    <div
      v-if="isOpen"
      :id="panelId"
      role="group"
      :aria-label="label"
      class="fixed z-50 flex w-56 flex-col gap-3 rounded-card border border-line bg-surface p-3 shadow-2xl"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    >
      <div class="grid grid-cols-6 gap-2">
        <button
          v-for="color in PALETTE"
          :key="color"
          type="button"
          :aria-label="color"
          :aria-pressed="isSame(color)"
          class="flex size-7 items-center justify-center rounded-full ring-1 ring-black/10 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          :style="{ backgroundColor: color, color: readableTextColor(color) }"
          @click="choose(color)"
        >
          <AppIcon
            v-if="isSame(color)"
            name="check"
            :size="14"
          />
        </button>
      </div>
      <label class="flex cursor-pointer items-center justify-between gap-2 border-t border-line pt-3 text-xs font-semibold text-content-muted">
        {{ t('common.colorPicker.custom') }}
        <span class="flex items-center gap-2">
          <code class="font-mono text-content">{{ modelValue.toLowerCase() }}</code>
          <input
            type="color"
            :value="modelValue"
            class="h-7 w-9 cursor-pointer rounded border border-line-strong bg-surface p-0.5"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          />
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { readableTextColor } from '@/utils/plan-dates';

// Ready-made colours that read well on both themes, plus any other colour from the system picker.
const PALETTE = ['#7c3aed', '#2563eb', '#0891b2', '#0f766e', '#16a34a', '#65a30d', '#ca8a04', '#ea580c', '#dc2626', '#be123c', '#db2777', '#535b68'];
const PANEL_WIDTH = 224;

const props = defineProps<{ modelValue: string; label: string }>();
const emit = defineEmits<{ 'update:modelValue': [color: string] }>();

const { t } = useI18n();
const panelId = useId();
const root = useTemplateRef<HTMLElement>('root');
const trigger = useTemplateRef<HTMLElement>('trigger');
const { isOpen, close, toggle } = useDropdown(root, trigger);
const position = ref({ top: 0, left: 0 });

function isSame(color: string): boolean {
  return color.toLowerCase() === props.modelValue.toLowerCase();
}

function openPanel(): void {
  const rect = trigger.value?.getBoundingClientRect();

  if (rect) {
    position.value = { top: rect.bottom + 6, left: Math.max(8, Math.min(rect.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8)) };
  }
  toggle();
}

function choose(color: string): void {
  emit('update:modelValue', color);
  close(true);
}

// The panel is placed once; scrolling the page or dialog would leave it behind, so it closes.
function handleScroll(): void {
  if (isOpen.value) {
    close();
  }
}

onMounted(() => window.addEventListener('scroll', handleScroll, true));
onBeforeUnmount(() => window.removeEventListener('scroll', handleScroll, true));
</script>
