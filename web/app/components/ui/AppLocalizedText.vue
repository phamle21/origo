<template>
  <component
    :is="as"
    class="break-words"
  >
    <span :lang="primary.locale">{{ primary.value }}</span>
    <AppBadge
      v-if="primary.isFallback"
      tone="warning"
      class="ml-1.5 align-middle"
      >{{ t('common.notTranslated') }}</AppBadge
    >
    <span
      v-if="secondaryLocale && !primary.isFallback"
      class="mt-0.5 block text-[0.92em] font-normal text-content-muted"
      :lang="secondaryLocale ?? undefined"
    >
      <template v-if="secondaryText">{{ secondaryText }}</template>
      <AppBadge
        v-else
        tone="warning"
        >{{ t('common.notTranslated') }}</AppBadge
      >
    </span>
  </component>
</template>

<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue';
import { CONTENT_LANGUAGE_KEY, DEFAULT_CONTENT_VIEW, resolveLocalizedText } from '@/utils/content-language';
import type { LocalizedText } from '~~/shared/contracts/content';

const props = withDefaults(
  defineProps<{
    text: LocalizedText;
    as?: string;
  }>(),
  { as: 'span' },
);

const { t } = useI18n();
const injected = inject(CONTENT_LANGUAGE_KEY, null);
const language = computed(() => injected?.value ?? DEFAULT_CONTENT_VIEW);

// When the wanted language is missing, a fallback is shown once with a "not translated" mark instead of
// repeating it as the secondary line; the secondary line is the reader's chosen second language.
const primary = computed(() => resolveLocalizedText(props.text, language.value.primary));
const secondaryLocale = computed(() => language.value.secondary);
const secondaryText = computed(() => (secondaryLocale.value ? (props.text[secondaryLocale.value]?.trim() ?? '') : ''));
</script>
