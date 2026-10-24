<template>
  <textarea
    v-if="isMultiline"
    :id="id"
    :value="value"
    :lang="locale"
    :rows="rows"
    :maxlength="maxLength"
    :required="isRequired"
    :aria-invalid="error ? 'true' : undefined"
    :aria-describedby="error ? errorId : undefined"
    :class="['w-full resize-y rounded-control border bg-surface px-3 py-2 text-sm focus:outline-none', borderClass]"
    @input="emit('input', ($event.target as HTMLTextAreaElement).value)"
    @blur="emit('blur')"
  />
  <input
    v-else
    :id="id"
    type="text"
    :value="value"
    :lang="locale"
    :maxlength="maxLength"
    :required="isRequired"
    :aria-invalid="error ? 'true' : undefined"
    :aria-describedby="error ? errorId : undefined"
    :class="['min-h-10 w-full rounded-control border bg-surface px-3 text-sm focus:outline-none', borderClass]"
    @input="emit('input', ($event.target as HTMLInputElement).value)"
    @blur="emit('blur')"
    @keydown.enter="handleEnter"
  />
</template>

<script setup lang="ts">
// One box of a localized field, a single line or several lines. Kept apart so the inline box and the
// dialog boxes look and behave the same.
const props = defineProps<{
  id: string;
  value: string;
  locale: string;
  isMultiline: boolean;
  isRequired: boolean;
  maxLength: number;
  rows: number;
  error: string;
  errorId: string;
  /** Inside the dialog, Enter confirms the dialog instead of submitting the form underneath it. */
  isEnterConfirm?: boolean;
}>();

const emit = defineEmits<{ input: [value: string]; blur: []; enter: [] }>();

const borderClass = computed(() => (props.error ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-accent'));

function handleEnter(event: KeyboardEvent): void {
  if (props.isEnterConfirm) {
    event.preventDefault();
    emit('enter');
  }
}
</script>
