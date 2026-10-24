<template>
  <div class="flex min-w-0 flex-col gap-1.5">
    <label
      :for="inputId"
      :class="isLabelHidden ? 'sr-only' : 'text-sm font-semibold'"
    >
      {{ label
      }}<span
        v-if="isRequired"
        aria-hidden="true"
        class="text-danger"
      >
        *</span
      >
    </label>
    <input
      :id="inputId"
      v-bind="$attrs"
      :value="modelValue"
      :type="type"
      :maxlength="maxLength"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      :class="[
        'min-h-10 w-full rounded-control border bg-surface px-3 text-sm focus:outline-none disabled:bg-surface-muted disabled:text-content-muted',
        error ? 'border-danger focus:border-danger' : 'border-line-strong focus:border-accent',
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="emit('blur')"
    />
    <p
      v-if="error"
      :id="errorId"
      class="flex items-center gap-1 text-xs font-medium text-danger"
    >
      <AppIcon
        name="info"
        :size="14"
      />
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="hintId"
      class="text-xs text-content-muted"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';

// A labelled text input that shows its validation message right under itself and tells assistive
// technology about it (aria-invalid, aria-describedby). Other attributes pass through to the input.
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    type?: 'text' | 'email' | 'password' | 'search';
    isRequired?: boolean;
    maxLength?: number;
    hint?: string;
    error?: string;
    /** Keeps the label for screen readers only, for compact rows. */
    isLabelHidden?: boolean;
  }>(),
  { isLabelHidden: false, type: 'text', isRequired: false, maxLength: undefined, hint: undefined, error: undefined },
);

const emit = defineEmits<{ 'update:modelValue': [value: string]; blur: [] }>();

const inputId = useId();
const errorId = useId();
const hintId = useId();
const describedBy = computed(() => (props.error ? errorId : props.hint ? hintId : undefined));
</script>
