<template>
  <div
    ref="root"
    :class="['relative inline-flex min-w-0', $attrs.class]"
  >
    <button
      :id="id"
      ref="trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="listId"
      :aria-label="ariaLabel"
      :disabled="isDisabled"
      :class="[
        'flex w-full min-w-0 items-center justify-between gap-2 rounded-control border px-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'min-h-9' : 'min-h-10',
        isHighlighted ? 'border-accent bg-accent-soft font-semibold text-content' : 'border-line-strong bg-surface text-content',
        isOpen ? 'border-accent' : 'hover:border-accent',
      ]"
      @click="toggle"
      @keydown="handleTriggerKeydown"
    >
      <span :class="['truncate', selected ? '' : 'text-content-muted']">{{ selected?.label ?? placeholder }}</span>
      <AppIcon
        name="chevronDown"
        :size="14"
        :class="['shrink-0 text-content-muted transition-transform', isOpen ? 'rotate-180' : '']"
      />
    </button>

    <!-- Fixed, not absolute, so a scrolling table or dialog cannot clip the list. -->
    <div
      v-if="isOpen"
      class="fixed z-50 flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-2xl"
      :style="panelStyle"
    >
      <div
        v-if="isSearchable"
        class="border-b border-line p-2"
      >
        <label class="relative block">
          <span class="sr-only">{{ t('common.select.search') }}</span>
          <span class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-content-muted"
            ><AppIcon
              name="search"
              :size="14"
          /></span>
          <input
            ref="search"
            v-model="query"
            type="search"
            autocomplete="off"
            maxlength="80"
            :placeholder="t('common.select.searchPlaceholder')"
            :aria-controls="listId"
            :aria-activedescendant="filtered[highlighted] ? optionId(highlighted) : undefined"
            class="min-h-9 w-full rounded-control border border-line-strong bg-surface pr-2 pl-8 text-sm focus:border-accent focus:outline-none"
            @keydown="handleSearchKeydown"
          />
        </label>
      </div>
      <ul
        :id="listId"
        ref="list"
        role="listbox"
        :tabindex="isSearchable ? undefined : -1"
        :aria-activedescendant="!isSearchable && filtered[highlighted] ? optionId(highlighted) : undefined"
        :aria-label="ariaLabel ?? placeholder"
        class="flex max-h-64 flex-col overflow-y-auto p-1 focus:outline-none"
        @keydown="handleSearchKeydown"
      >
        <li
          v-for="(option, index) in filtered"
          :id="optionId(index)"
          :key="String(option.value)"
          role="option"
          :aria-selected="option.value === modelValue"
          :aria-disabled="option.isDisabled || undefined"
          :class="[
            'flex min-h-9 items-center gap-2 rounded-control px-2.5 py-1.5 text-sm',
            option.isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            index === highlighted && !option.isDisabled ? 'bg-accent-soft text-accent-strong' : '',
            option.value === modelValue ? 'font-semibold' : '',
          ]"
          @mousedown.prevent="choose(option)"
          @mouseenter="highlighted = index"
        >
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="break-words">{{ option.label }}</span>
            <span
              v-if="option.hint"
              class="text-xs font-normal text-content-muted"
              >{{ option.hint }}</span
            >
          </span>
          <AppIcon
            v-if="option.value === modelValue"
            name="check"
            :size="14"
            class="shrink-0 text-accent-strong"
          />
        </li>
        <li
          v-if="!filtered.length"
          class="px-2.5 py-3 text-center text-sm text-content-muted"
        >
          {{ t('common.select.noMatch') }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { matchesSearch } from '@/utils/search';

export type AppSelectValue = string | number | null;

export interface AppSelectOption {
  value: AppSelectValue;
  label: string;
  /** A second, quieter line, e.g. a role's description. */
  hint?: string;
  isDisabled?: boolean;
}

/**
 * The app's own select box: looks the same in every browser and theme. Long lists get a search box
 * at the top (accents are ignored, so "quan ly" finds "Quản lý"). Keyboard: Enter, Space
 * or ↓ opens; ↑ ↓ move; Enter picks; Escape closes. Typing on the closed box starts a search.
 */
defineOptions({ inheritAttrs: false });

const PANEL_MAX_HEIGHT = 320;
/** Short lists open without a search box; longer ones get one. */
const SEARCH_FROM = 8;
const PANEL_MIN_WIDTH = 224;

const props = withDefaults(
  defineProps<{
    modelValue: AppSelectValue;
    options: AppSelectOption[];
    placeholder?: string;
    size?: 'sm' | 'md';
    id?: string;
    ariaLabel?: string;
    isDisabled?: boolean;
    /** Marks a set filter so it is not forgotten. */
    isHighlighted?: boolean;
    /** Forces the search box on or off; by default only long lists have it. */
    searchable?: boolean;
  }>(),
  { searchable: undefined, placeholder: '', size: 'md', id: undefined, ariaLabel: undefined, isDisabled: false, isHighlighted: false },
);

const emit = defineEmits<{ 'update:modelValue': [value: AppSelectValue]; change: [value: AppSelectValue] }>();

const { t } = useI18n();
const listId = useId();
const root = useTemplateRef<HTMLElement>('root');
const trigger = useTemplateRef<HTMLButtonElement>('trigger');
const search = useTemplateRef<HTMLInputElement>('search');
const list = useTemplateRef<HTMLElement>('list');
const { isOpen, close } = useDropdown(root, trigger);
const query = ref('');
const highlighted = ref(0);
const panelStyle = ref<Record<string, string>>({});
// Opening may itself scroll the box into view; only scrolling after that moment closes the list.
const SCROLL_GRACE_MILLISECONDS = 250;
let openedAt = 0;

const isSearchable = computed(() => props.searchable ?? props.options.length >= SEARCH_FROM);
const selected = computed(() => props.options.find((option) => option.value === props.modelValue) ?? null);
const filtered = computed(() => props.options.filter((option) => matchesSearch([option.label, option.hint ?? ''], query.value)));

function optionId(index: number): string {
  return `${listId}-${index}`;
}

function place(): void {
  const rect = trigger.value?.getBoundingClientRect();

  if (!rect) {
    return;
  }

  const width = Math.max(rect.width, PANEL_MIN_WIDTH);
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  const spaceBelow = window.innerHeight - rect.bottom;
  const opensUp = spaceBelow < PANEL_MAX_HEIGHT && rect.top > spaceBelow;

  panelStyle.value = {
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${Math.min(PANEL_MAX_HEIGHT, (opensUp ? rect.top : spaceBelow) - 12)}px`,
    ...(opensUp ? { bottom: `${window.innerHeight - rect.top + 4}px` } : { top: `${rect.bottom + 4}px` }),
  };
}

async function open(initialQuery = ''): Promise<void> {
  if (props.isDisabled) {
    return;
  }

  query.value = initialQuery;
  place();
  openedAt = Date.now();
  isOpen.value = true;
  await nextTick();
  highlighted.value = Math.max(
    0,
    filtered.value.findIndex((option) => option.value === props.modelValue),
  );
  // Without a search box, the list itself takes the keys.
  (search.value ?? list.value)?.focus();
  scrollHighlightedIntoView();
}

function toggle(): void {
  if (isOpen.value) {
    close(true);
  } else {
    open();
  }
}

function choose(option: AppSelectOption): void {
  if (option.isDisabled) {
    return;
  }

  close(true);

  if (option.value !== props.modelValue) {
    emit('update:modelValue', option.value);
    emit('change', option.value);
  }
}

function scrollHighlightedIntoView(): void {
  list.value?.children[highlighted.value]?.scrollIntoView?.({ block: 'nearest' });
}

function move(step: number): void {
  const count = filtered.value.length;

  if (!count) {
    return;
  }

  let next = highlighted.value;

  // Skip disabled options; give up after one full turn.
  for (let tries = 0; tries < count; tries++) {
    next = (next + step + count) % count;

    if (!filtered.value[next]?.isDisabled) {
      break;
    }
  }

  highlighted.value = next;
  nextTick(scrollHighlightedIntoView);
}

function handleTriggerKeydown(event: KeyboardEvent): void {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
    event.preventDefault();
    open();
  } else if (isSearchable.value && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    open(event.key);
  }
}

function handleSearchKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    move(event.key === 'ArrowDown' ? 1 : -1);
  } else if (event.key === 'Enter') {
    event.preventDefault();

    const option = filtered.value[highlighted.value];

    if (option) {
      choose(option);
    }
  } else if (event.key === 'Tab') {
    close();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    close(true);
  }
}

watch(query, () => {
  highlighted.value = Math.max(
    0,
    filtered.value.findIndex((option) => !option.isDisabled),
  );
});

// The list is placed once; scrolling or resizing elsewhere would leave it behind, so it closes.
function handleViewportChange(event: Event): void {
  if (isOpen.value && Date.now() - openedAt > SCROLL_GRACE_MILLISECONDS && !(event.target instanceof Node && root.value?.contains(event.target))) {
    close();
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleViewportChange, true);
  window.addEventListener('resize', handleViewportChange);
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleViewportChange, true);
  window.removeEventListener('resize', handleViewportChange);
});
</script>
