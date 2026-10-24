<template>
  <label class="inline-flex min-w-0 items-center gap-2">
    <span class="sr-only">{{ label }}</span>
    <!-- `selected` is set on the option itself because SSR does not derive it from the select's value. -->
    <AppSelect
      :model-value="currentCode"
      size="sm"
      class="max-w-full min-w-48 font-semibold"
      :aria-label="label"
      :options="screens.map((screen) => ({ value: screen.code, label: resolveLocalizedText(screen.name, language.primary).value, hint: screen.code }))"
      @update:model-value="emit('change', String($event))"
    />
  </label>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import { CONTENT_LANGUAGE_KEY, DEFAULT_CONTENT_VIEW, resolveLocalizedText } from '@/utils/content-language';
import type { ScreenSummary } from '~~/shared/contracts/screen';

defineProps<{
  screens: Pick<ScreenSummary, 'code' | 'name'>[];
  currentCode: string;
  label: string;
}>();

const emit = defineEmits<{ change: [code: string] }>();

const injected = inject(CONTENT_LANGUAGE_KEY, null);
const language = computed(() => injected?.value ?? DEFAULT_CONTENT_VIEW);
</script>
