<template>
  <div
    role="alert"
    class="flex flex-col items-start gap-3 rounded-card border border-danger-soft bg-danger-soft px-5 py-4"
  >
    <p class="text-sm break-words text-danger">{{ message }}</p>
    <AppButton
      variant="secondary"
      @click="emit('retry')"
      >{{ retryLabel }}</AppButton
    >
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

defineProps<{
  message: string;
  retryLabel: string;
}>();

const emit = defineEmits<{ retry: [] }>();
</script>
