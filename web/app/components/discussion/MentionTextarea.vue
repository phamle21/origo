<template>
  <div class="relative">
    <textarea
      :id="id"
      ref="field"
      :value="modelValue"
      rows="3"
      maxlength="2000"
      :placeholder="placeholder"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="isOpen"
      :aria-controls="listId"
      :aria-activedescendant="isOpen && options[highlighted] ? `${listId}-${options[highlighted]?.id}` : undefined"
      class="w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
      @input="handleInput"
      @click="updateQuery"
      @keydown="handleKeydown"
      @blur="close"
    />
    <ul
      v-if="isOpen"
      :id="listId"
      role="listbox"
      :aria-label="t('screen.comments.mentionList')"
      class="absolute bottom-full left-0 z-30 mb-1 flex max-h-60 w-72 max-w-full flex-col overflow-y-auto rounded-card border border-line bg-surface p-1 shadow-2xl"
    >
      <li
        v-for="(person, index) in options"
        :id="`${listId}-${person.id}`"
        :key="person.id"
        role="option"
        :aria-selected="index === highlighted"
        :class="[
          'flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm',
          index === highlighted ? 'bg-accent-soft text-accent-strong' : 'hover:bg-surface-muted',
        ]"
        @mousedown.prevent="pick(person)"
        @mouseenter="highlighted = index"
      >
        <AppAvatar
          :initials="person.initials"
          size="sm"
        />
        <span class="flex min-w-0 flex-col leading-tight">
          <span class="truncate font-semibold">{{ person.name }}</span>
          <span
            v-if="person.title"
            class="truncate text-xs text-content-muted"
            >{{ person.title }}</span
          >
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AppAvatar from '@/components/ui/AppAvatar.vue';
import { keptMentions, mentionQueryAt } from '@/utils/mentions';
import type { UserOption } from '~~/shared/contracts/member';

// A comment box where typing "@" lists the project's people; picking one writes "@Name" and remembers
// who was tagged. The parent receives the text and, separately, the ids still tagged in it.
const MAX_OPTIONS = 8;

const props = defineProps<{ modelValue: string; people: UserOption[]; id: string; placeholder: string }>();

const emit = defineEmits<{ 'update:modelValue': [text: string]; 'update:mentions': [ids: number[]] }>();

const { t } = useI18n();
const listId = useId();
const field = useTemplateRef<HTMLTextAreaElement>('field');
const query = ref<{ start: number; query: string } | null>(null);
const highlighted = ref(0);
const picked = ref<UserOption[]>([]);

const options = computed(() => {
  if (!query.value) {
    return [];
  }

  const needle = query.value.query.trim().toLowerCase();

  return props.people
    .filter((person) => !needle || person.name.toLowerCase().includes(needle) || person.email.toLowerCase().includes(needle))
    .slice(0, MAX_OPTIONS);
});
const isOpen = computed(() => options.value.length > 0);

watch(
  () => props.modelValue,
  (text) => {
    if (!text) {
      picked.value = [];
    }
    emit('update:mentions', keptMentions(text, picked.value));
  },
);

function updateQuery(): void {
  const element = field.value;

  query.value = element ? mentionQueryAt(element.value, element.selectionStart ?? element.value.length) : null;
  highlighted.value = 0;
}

function handleInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
  updateQuery();
}

function close(): void {
  query.value = null;
}

async function pick(person: UserOption): Promise<void> {
  const element = field.value;
  const current = query.value;

  if (!element || !current) {
    return;
  }

  const caret = element.selectionStart ?? element.value.length;
  const text = `${element.value.slice(0, current.start)}@${person.name} ${element.value.slice(caret)}`;
  const nextCaret = current.start + person.name.length + 2;

  picked.value = [...picked.value.filter((entry) => entry.id !== person.id), person];
  close();
  emit('update:modelValue', text);
  await nextTick();
  element.focus();
  element.setSelectionRange(nextCaret, nextCaret);
}

function handleKeydown(event: KeyboardEvent): void {
  if (!isOpen.value) {
    return;
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    highlighted.value = (highlighted.value + (event.key === 'ArrowDown' ? 1 : -1) + options.value.length) % options.value.length;
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    const person = options.value[highlighted.value];

    if (person) {
      event.preventDefault();
      pick(person);
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    close();
  }
}
</script>
