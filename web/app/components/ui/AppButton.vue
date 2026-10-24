<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :class="[
      'inline-flex min-w-0 items-center justify-center gap-2 rounded-control px-3 py-1.5 text-sm font-medium',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      'disabled:cursor-not-allowed disabled:opacity-60',
      variantClasses[variant],
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
type AppButtonVariant = 'primary' | 'secondary' | 'danger';

const variantClasses: Record<AppButtonVariant, string> = {
  primary: 'bg-accent text-accent-contrast',
  secondary: 'border border-line bg-surface text-content',
  // Actions that lock someone out, delete or cannot be undone: red so they are never clicked by habit.
  danger: 'border border-danger/50 bg-danger-soft font-semibold text-danger hover:bg-danger hover:text-surface',
};

withDefaults(
  defineProps<{
    variant?: AppButtonVariant;
    type?: 'button' | 'submit' | 'reset';
    isDisabled?: boolean;
  }>(),
  {
    variant: 'primary',
    type: 'button',
    isDisabled: false,
  },
);
</script>
