<template>
  <div
    role="tablist"
    :aria-label="label"
    class="flex flex-wrap gap-1 rounded-control bg-neutral-soft p-1"
    @keydown="handleKeydown"
  >
    <button
      v-for="tab in tabs"
      :id="`${idPrefix}-tab-${tab.id}`"
      :key="tab.id"
      ref="tabButtons"
      type="button"
      role="tab"
      :aria-selected="tab.id === modelValue"
      :aria-controls="`${idPrefix}-panel-${tab.id}`"
      :tabindex="tab.id === modelValue ? 0 : -1"
      class="inline-flex min-h-9 flex-1 basis-auto items-center justify-center gap-1.5 rounded-control px-2.5 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-accent"
      :class="tab.id === modelValue ? 'bg-surface font-semibold text-accent-strong shadow-sm' : 'text-content-muted hover:text-content'"
      @click="emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count"
        class="rounded-full bg-surface-muted px-1.5 text-xs font-semibold text-neutral"
        >{{ tab.count }}</span
      >
    </button>
  </div>
</template>

<script setup lang="ts">
// Tabs share the row equally and wrap onto a second row on narrow screens, so no tab is ever hidden
// behind horizontal scrolling.
const props = defineProps<{
  tabs: { id: string; label: string; count?: number }[];
  modelValue: string;
  label: string;
  /** Prefix for tab and panel ids; the parent gives its panel `id="<prefix>-panel-<tab id>"`. */
  idPrefix: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [id: string] }>();

const tabButtons = useTemplateRef<HTMLButtonElement[]>('tabButtons');

// Arrow keys move between tabs and select them, following the WAI-ARIA tabs pattern.
function handleKeydown(event: KeyboardEvent): void {
  const currentIndex = props.tabs.findIndex((tab) => tab.id === props.modelValue);
  const lastIndex = props.tabs.length - 1;
  const targetIndex = { ArrowRight: currentIndex + 1, ArrowLeft: currentIndex - 1, Home: 0, End: lastIndex }[event.key];

  if (targetIndex === undefined || lastIndex < 0) {
    return;
  }

  event.preventDefault();

  const wrappedIndex = (targetIndex + props.tabs.length) % props.tabs.length;
  const target = props.tabs[wrappedIndex];

  if (target) {
    emit('update:modelValue', target.id);
    tabButtons.value?.[wrappedIndex]?.focus();
  }
}
</script>
