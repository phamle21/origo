<template>
  <div
    role="status"
    class="flex flex-col gap-2 rounded-card border border-warning bg-warning-soft p-4 text-sm text-warning"
  >
    <p class="font-semibold">{{ t('admin.password.title', { name }) }}</p>
    <div class="flex flex-wrap items-center gap-2">
      <code class="rounded-control bg-surface px-3 py-1.5 font-mono text-base break-all text-content select-all">{{ password }}</code>
      <AppButton
        variant="secondary"
        @click="handleCopy"
        >{{ isCopied ? t('admin.password.copied') : t('admin.password.copy') }}</AppButton
      >
      <AppButton
        variant="secondary"
        @click="emit('dismiss')"
        >{{ t('admin.password.done') }}</AppButton
      >
    </div>
    <p>{{ t('admin.password.hint') }}</p>
  </div>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

const props = defineProps<{ name: string; password: string }>();

const emit = defineEmits<{ dismiss: [] }>();

const { t } = useI18n();
const isCopied = ref(false);

async function handleCopy(): Promise<void> {
  isCopied.value = await navigator.clipboard
    .writeText(props.password)
    .then(() => true)
    .catch(() => false);
}
</script>
