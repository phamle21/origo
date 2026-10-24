<template>
  <div class="relative flex flex-col gap-1">
    <label
      :for="inputId"
      class="text-xs font-semibold text-content-muted"
      >{{ label }}</label
    >
    <input
      :id="inputId"
      v-model="query"
      type="search"
      maxlength="100"
      autocomplete="off"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-controls="listId"
      :placeholder="t('team.picker.placeholder')"
      class="min-h-10 rounded-control border border-line-strong bg-surface px-3 text-sm focus:border-accent focus:outline-none"
      @keydown.down.prevent="moveHighlight(1)"
      @keydown.up.prevent="moveHighlight(-1)"
      @keydown.enter.prevent="pickHighlighted"
      @keydown.esc="isOpen = false"
    />
    <ul
      v-if="isOpen"
      :id="listId"
      role="listbox"
      class="absolute top-full right-0 left-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-control border border-line bg-surface py-1 shadow-lg"
    >
      <li
        v-if="isPending"
        class="px-3 py-2 text-sm text-content-muted"
      >
        {{ t('team.picker.searching') }}
      </li>
      <li
        v-else-if="!options.length"
        class="px-3 py-2 text-sm text-content-muted"
      >
        {{ t('team.picker.noMatch') }}
      </li>
      <li
        v-for="(option, index) in options"
        v-else
        :key="option.id"
        role="option"
        :aria-selected="index === highlighted"
        :class="['flex cursor-pointer items-center gap-2 px-3 py-2 text-sm', index === highlighted ? 'bg-accent-soft' : 'hover:bg-surface-muted']"
        @mousedown.prevent="pick(option)"
      >
        <AppAvatar
          :initials="option.initials"
          size="sm"
        />
        <span class="flex min-w-0 flex-col leading-tight">
          <span class="font-medium break-words">{{ option.name }}</span>
          <span class="text-xs break-all text-content-muted">{{ option.email }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AppAvatar from '@/components/ui/AppAvatar.vue';
import type { UserOption } from '~~/shared/contracts/member';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MILLISECONDS = 250;

const props = defineProps<{
  label: string;
  /** Searches accounts; injected so the picker stays presentational and testable. */
  search: (query: string) => Promise<UserOption[]>;
  /** Accounts that cannot be picked again, such as current members. */
  excludeIds?: number[];
}>();

const emit = defineEmits<{ pick: [user: UserOption] }>();

const { t } = useI18n();
const inputId = useId();
const listId = useId();
const query = ref('');
const results = ref<UserOption[]>([]);
const isOpen = ref(false);
const isPending = ref(false);
const highlighted = ref(0);

const options = computed(() => results.value.filter((option) => !props.excludeIds?.includes(option.id)));

let timer: ReturnType<typeof setTimeout> | undefined;
let latestSearch = 0;

watch(query, (value) => {
  clearTimeout(timer);

  const needle = value.trim();

  if (needle.length < MIN_QUERY_LENGTH) {
    isOpen.value = false;
    results.value = [];

    return;
  }

  isOpen.value = true;
  isPending.value = true;
  timer = setTimeout(async () => {
    const searchId = ++latestSearch;
    const found = await props.search(needle).catch(() => []);

    if (searchId === latestSearch) {
      results.value = found;
      highlighted.value = 0;
      isPending.value = false;
    }
  }, DEBOUNCE_MILLISECONDS);
});

onBeforeUnmount(() => clearTimeout(timer));

function moveHighlight(step: number): void {
  if (options.value.length) {
    highlighted.value = (highlighted.value + step + options.value.length) % options.value.length;
  }
}

function pick(option: UserOption): void {
  emit('pick', option);
  query.value = '';
  isOpen.value = false;
}

function pickHighlighted(): void {
  const option = options.value[highlighted.value];

  if (isOpen.value && option) {
    pick(option);
  }
}
</script>
