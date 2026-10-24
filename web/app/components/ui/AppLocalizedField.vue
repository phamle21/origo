<template>
  <div class="flex min-w-0 flex-col gap-1.5">
    <label
      :for="`${idPrefix}-${primary.code}`"
      :class="isLabelHidden ? 'sr-only' : 'text-sm font-medium'"
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
    <div class="flex min-w-0 items-start gap-2">
      <AppLocalizedInput
        :id="`${idPrefix}-${primary.code}`"
        class="min-w-0 flex-1"
        :value="modelValue[primary.code] ?? ''"
        :locale="primary.code"
        :is-multiline="isMultiline"
        :is-required="isRequired"
        :max-length="maxLength"
        :rows="rows"
        :error="errorFor?.(primary.code) ?? ''"
        :error-id="`${idPrefix}-${primary.code}-error`"
        @input="(value) => emit('update:modelValue', withValue(modelValue, primary.code, value))"
        @blur="emit('blur', primary.code)"
      />
      <button
        v-if="others.length"
        type="button"
        :class="[
          'flex min-h-10 shrink-0 items-center gap-1.5 rounded-control border px-2.5 text-xs font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          hasOtherError
            ? 'border-danger bg-danger-soft text-danger'
            : 'border-line-strong bg-surface text-content-muted hover:border-accent hover:text-accent-strong',
        ]"
        :aria-label="t('common.localized.open', { label, filled: filledCount, total: others.length })"
        :title="t('common.localized.openHint')"
        @click="openDialog"
      >
        <AppIcon
          name="globe"
          :size="16"
        />
        {{ filledCount }}/{{ others.length }}
      </button>
    </div>
    <span
      v-if="errorFor?.(primary.code)"
      :id="`${idPrefix}-${primary.code}-error`"
      class="text-xs font-medium text-danger"
      >{{ errorFor?.(primary.code) }}</span
    >
    <span
      v-else-if="hasOtherError"
      class="text-xs font-medium text-danger"
      >{{ t('common.localized.otherError') }}</span
    >

    <AppDialog
      v-model:open="isDialogOpen"
      icon="globe"
      :title="label"
      :description="t('common.localized.dialogHint', { language: primary.name })"
      :is-dirty="isDraftDirty"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-control bg-surface-muted px-3 py-2 text-sm">
          <span class="text-content-muted">{{ t('common.localized.translateHint') }}</span>
          <AppButton
            variant="secondary"
            :is-disabled="!draftSource || isTranslating || !emptyOthers.length"
            @click="translateInto(emptyOthers.map((language) => language.code))"
          >
            <span class="inline-flex items-center gap-1.5"
              ><AppIcon
                name="globe"
                :size="16"
              />{{ isTranslating ? t('common.localized.translating') : t('common.localized.translateEmpty') }}</span
            >
          </AppButton>
        </div>
        <p
          v-if="translateError"
          role="alert"
          class="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {{ translateError }}
        </p>

        <div
          v-for="language in languages"
          :key="language.code"
          class="flex min-w-0 flex-col gap-1.5"
        >
          <div class="flex flex-wrap items-center gap-2">
            <label
              :for="`${idPrefix}-dialog-${language.code}`"
              class="text-sm font-semibold"
              >{{ language.name }}</label
            >
            <AppBadge
              v-if="language.code === primary.code"
              tone="accent"
              >{{ t('common.localized.source') }}</AppBadge
            >
            <button
              v-else
              type="button"
              class="ml-auto inline-flex min-h-8 items-center gap-1 rounded-control px-2 text-xs font-semibold text-accent-strong hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!draftSource || isTranslating"
              :aria-label="t('common.localized.translateOne', { language: language.name })"
              @click="translateInto([language.code])"
            >
              <AppIcon
                name="globe"
                :size="14"
              />
              {{ t('common.localized.translate') }}
            </button>
          </div>
          <AppLocalizedInput
            :id="`${idPrefix}-dialog-${language.code}`"
            :value="draft[language.code] ?? ''"
            :locale="language.code"
            :is-multiline="isMultiline"
            :is-required="isRequired && language.code === primary.code"
            :max-length="maxLength"
            :rows="rows"
            :error="errorFor?.(language.code) ?? ''"
            :error-id="`${idPrefix}-dialog-${language.code}-error`"
            @input="(value) => (draft = withValue(draft, language.code, value))"
            is-enter-confirm
            @enter="apply"
          />
          <span
            v-if="errorFor?.(language.code)"
            :id="`${idPrefix}-dialog-${language.code}-error`"
            class="text-xs font-medium text-danger"
            >{{ errorFor?.(language.code) }}</span
          >
        </div>

        <div class="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <AppButton
            variant="secondary"
            @click="isDialogOpen = false"
            >{{ t('common.actions.cancel') }}</AppButton
          >
          <AppButton @click="apply">{{ t('common.localized.done') }}</AppButton>
        </div>
      </div>
    </AppDialog>
  </div>
</template>

<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedInput from '@/components/ui/AppLocalizedInput.vue';
import { translateContent } from '@/api/content/content';
import { DEFAULT_CONTENT_LOCALE, type ContentLanguageOption, type ContentLocale, type LocalizedText } from '~~/shared/contracts/content';

// The form shows only the default language (Vietnamese). The 🌐 button opens a dialog with every active
// content language, the default one included, where the others can be typed or machine-translated.
// Keys of switched-off languages in the value are passed back untouched, so their translations are kept.
const props = withDefaults(
  defineProps<{
    modelValue: LocalizedText;
    label: string;
    isMultiline?: boolean;
    isRequired?: boolean;
    maxLength?: number;
    rows?: number;
    /** Validation message for one language, shown under that language's box. */
    errorFor?: (locale: ContentLocale) => string;
    /** Keeps the label for screen readers only, for compact rows that carry a column heading. */
    isLabelHidden?: boolean;
  }>(),
  { isLabelHidden: false, isMultiline: false, isRequired: false, maxLength: 2_000, rows: 2, errorFor: undefined },
);

const emit = defineEmits<{ 'update:modelValue': [value: LocalizedText]; blur: [locale: ContentLocale] }>();

const DEFAULT_LANGUAGE: ContentLanguageOption = { code: DEFAULT_CONTENT_LOCALE, name: DEFAULT_CONTENT_LOCALE, isActive: true, isDefault: true };

const { t } = useI18n();
const idPrefix = useId();
const languages = useContentLanguages();

const primary = computed(() => languages.value.find((language) => language.isDefault) ?? languages.value[0] ?? DEFAULT_LANGUAGE);
const others = computed(() => languages.value.filter((language) => language.code !== primary.value.code));
const filledCount = computed(() => others.value.filter((language) => props.modelValue[language.code]?.trim()).length);
const hasOtherError = computed(() => others.value.some((language) => props.errorFor?.(language.code)));

const isDialogOpen = ref(false);
const draft = ref<LocalizedText>({ vi: null });
const isTranslating = ref(false);
const translateError = ref('');

const isDraftDirty = computed(() => languages.value.some((language) => (draft.value[language.code] ?? null) !== (props.modelValue[language.code] ?? null)));
const draftSource = computed(() => draft.value[primary.value.code]?.trim() ?? '');
const emptyOthers = computed(() => others.value.filter((language) => !draft.value[language.code]?.trim()));

function withValue(text: LocalizedText, locale: ContentLocale, value: string): LocalizedText {
  return { ...text, [locale]: value === '' ? null : value };
}

function openDialog(): void {
  draft.value = { ...props.modelValue };
  translateError.value = '';
  isDialogOpen.value = true;
}

function apply(): void {
  emit('update:modelValue', { ...draft.value });
  languages.value.forEach((language) => emit('blur', language.code));
  isDialogOpen.value = false;
}

// Fills the given languages from the default one. A language the service could not do stays as it was.
async function translateInto(locales: ContentLocale[]): Promise<void> {
  if (!draftSource.value || !locales.length) {
    return;
  }

  isTranslating.value = true;
  translateError.value = '';

  try {
    const { translations } = await translateContent({ text: draftSource.value, from: primary.value.code, to: locales });
    const next = { ...draft.value };

    for (const [locale, text] of Object.entries(translations)) {
      if (text) {
        next[locale] = text.slice(0, props.maxLength);
      }
    }

    draft.value = next;

    if (locales.some((locale) => !translations[locale])) {
      translateError.value = t('common.localized.translatePartial');
    }
  } catch {
    translateError.value = t('common.localized.translateFailed');
  } finally {
    isTranslating.value = false;
  }
}
</script>
