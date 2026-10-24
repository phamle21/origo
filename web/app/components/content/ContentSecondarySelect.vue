<template>
  <div class="flex flex-col gap-1.5 text-sm">
    <label
      :for="selectId"
      class="text-xs font-semibold text-content-muted"
      >{{ t('layout.secondaryLanguage') }}</label
    >
    <AppSelect
      :id="selectId"
      :model-value="modelValue"
      size="sm"
      class="w-full"
      :options="[{ value: '', label: t('layout.secondaryNone') }, ...options.map((language) => ({ value: language.code, label: language.name }))]"
      @update:model-value="emit('update:modelValue', String($event ?? ''))"
    />
  </div>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import type { ContentLanguageOption } from '~~/shared/contracts/content';

// Picks a second content language to show under every text (or none), for translators and reviewers.
const props = defineProps<{ modelValue: string; languages: ContentLanguageOption[]; primary: string }>();

const emit = defineEmits<{ 'update:modelValue': [code: string] }>();

const { t } = useI18n();
const selectId = useId();
const options = computed(() => props.languages.filter((language) => language.code !== props.primary));
</script>
