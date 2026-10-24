<template>
  <span :class="['relative inline-flex shrink-0 items-center justify-center', SIZE_CLASSES[size]]">
    <input
      v-bind="$attrs"
      type="checkbox"
      :checked="modelValue"
      :disabled="isDisabled"
      :class="[
        'peer size-full cursor-pointer appearance-none rounded-md border-2 border-line-strong bg-surface transition-colors',
        'checked:border-accent checked:bg-accent hover:border-accent',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-strong disabled:checked:hover:border-accent',
      ]"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="pointer-events-none absolute hidden size-[70%] text-accent-contrast peer-checked:block"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  </span>
</template>

<script setup lang="ts">
// A larger, clearly drawn checkbox. It stays a native input, so labels, keyboard and screen readers
// work as usual; attributes such as `aria-label` and `id` pass through to the input.
defineOptions({ inheritAttrs: false });

const SIZE_CLASSES = { md: 'size-5', lg: 'size-6' } as const;

withDefaults(defineProps<{ modelValue: boolean; isDisabled?: boolean; size?: keyof typeof SIZE_CLASSES }>(), { isDisabled: false, size: 'lg' });

const emit = defineEmits<{ 'update:modelValue': [isChecked: boolean] }>();
</script>
