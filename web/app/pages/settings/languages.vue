<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.settings'), to: localePath('/settings') }, { label: t('layout.sectionNav.languages') }]" />

  <div class="flex flex-col gap-4 px-4 py-8 sm:px-6">
    <AppPageSkeleton
      v-if="isPending && !data"
      variant="form"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <AppFormCard
      v-else
      form-id="languages-form"
      tile="settings"
      :title="t('settings.languages.title')"
      :description="t('settings.languages.description')"
      :error="saving.hasFailed.value ? saving.errorMessage.value : ''"
      @submit="handleSave"
    >
      <AppFormSection
        :number="1"
        :title="t('settings.languages.current')"
        :description="t('settings.languages.currentHint')"
      >
        <ol class="flex flex-col gap-2">
          <li
            v-for="(language, index) in draft"
            :key="language.code"
            :class="[
              'flex flex-wrap items-start gap-2 rounded-control border p-2 md:flex-nowrap',
              language.isActive ? 'border-line bg-surface' : 'border-dashed border-line-strong bg-surface-muted',
            ]"
          >
            <span
              aria-hidden="true"
              class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-contrast"
              >{{ index + 1 }}</span
            >
            <code class="mt-2 min-w-12 shrink-0 rounded bg-neutral-soft px-1.5 py-0.5 text-center font-mono text-xs text-content">{{ language.code }}</code>
            <AppTextField
              v-model="language.name"
              class="min-w-40 flex-1"
              :label="t('settings.languages.nameOf', { code: language.code })"
              is-label-hidden
              :max-length="60"
              is-required
              :error="form.error(`languages.${index}.name`)"
              @blur="form.touch(`languages.${index}.name`)"
            />
            <span class="flex shrink-0 flex-wrap items-center gap-2">
              <AppBadge
                v-if="language.code === DEFAULT_CONTENT_LOCALE"
                tone="accent"
                >{{ t('settings.languages.default') }}</AppBadge
              >
              <AppBadge
                v-if="!savedCodes.has(language.code)"
                tone="info"
                >{{ t('settings.languages.new') }}</AppBadge
              >
              <label
                :class="[
                  'flex min-h-10 items-center gap-2 rounded-control px-2 text-sm font-semibold whitespace-nowrap',
                  language.code === DEFAULT_CONTENT_LOCALE ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-surface-muted',
                ]"
              >
                <AppCheckbox
                  :model-value="language.isActive"
                  :is-disabled="language.code === DEFAULT_CONTENT_LOCALE"
                  @update:model-value="toggleActive(language, $event)"
                />
                {{ t('settings.languages.inUse') }}
              </label>
              <AppButton
                variant="danger"
                :is-disabled="index <= 1"
                :aria-label="t('plan.panel.moveUp')"
                @click="move(index, -1)"
                >↑</AppButton
              >
              <AppButton
                variant="secondary"
                :is-disabled="index === 0 || index === draft.length - 1"
                :aria-label="t('plan.panel.moveDown')"
                @click="move(index, 1)"
                >↓</AppButton
              >
              <AppButton
                v-if="!savedCodes.has(language.code)"
                variant="secondary"
                :aria-label="t('settings.languages.removeNew', { name: language.name })"
                @click="draft.splice(index, 1)"
              >
                <AppIcon
                  name="trash"
                  :size="16"
                />
              </AppButton>
            </span>
          </li>
        </ol>
        <p class="text-xs text-content-muted">{{ t('settings.languages.keepNote') }}</p>
      </AppFormSection>

      <AppFormSection
        :number="2"
        :title="t('settings.languages.add')"
        :description="t('settings.languages.addHint')"
      >
        <div class="grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]">
          <label class="flex flex-col gap-1.5 text-sm font-semibold">
            {{ t('settings.languages.pick') }}
            <AppSelect
              :model-value="pickedSuggestion"
              class="w-full font-normal"
              :options="[
                { value: '', label: t('settings.languages.custom') },
                ...availableSuggestions.map((suggestion) => ({ value: suggestion.code, label: `${suggestion.name} (${suggestion.code})` })),
              ]"
              @update:model-value="pickSuggestion(String($event ?? ''))"
            />
          </label>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <AppTextField
              v-model="newLanguage.code"
              class="font-mono lowercase"
              :label="t('settings.languages.code')"
              :max-length="12"
              :hint="t('settings.languages.codeHint')"
              :error="addError('code')"
            />
            <AppTextField
              v-model="newLanguage.name"
              :label="t('settings.languages.name')"
              :max-length="60"
              :error="addError('name')"
            />
          </div>
          <AppButton
            class="md:mt-7"
            :is-disabled="draft.length >= MAX_CONTENT_LANGUAGES"
            @click="handleAdd"
          >
            <span class="inline-flex items-center gap-1.5"><AppIcon name="plus" />{{ t('settings.languages.addButton') }}</span>
          </AppButton>
        </div>
      </AppFormSection>

      <template #actions>
        <AppButton
          variant="secondary"
          :is-disabled="!isDirty || saving.isPending.value"
          @click="restore"
          >{{ t('common.unsaved.discard') }}</AppButton
        >
        <AppButton
          type="submit"
          :is-disabled="!isDirty || saving.isPending.value"
          >{{ saving.isPending.value ? t('common.actions.saving') : t('common.actions.save') }}</AppButton
        >
      </template>
    </AppFormCard>

    <AppUnsavedBar
      class="max-w-5xl"
      :show="isDirty"
      :is-saving="saving.isPending.value"
      form="languages-form"
      :hint="t('settings.languages.unsavedHint')"
      @discard="restore"
    />
  </div>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import { z } from 'zod';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppFormCard from '@/components/ui/AppFormCard.vue';
import AppFormSection from '@/components/ui/AppFormSection.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppTextField from '@/components/ui/AppTextField.vue';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';
import { fetchAllContentLanguages, saveContentLanguages } from '@/api/content/content';
import { loadContentLanguages } from '@/composables/content/useContentLanguages';
import { formRules } from '@/utils/form-rules';
import { CONTENT_LOCALE_PATTERN, DEFAULT_CONTENT_LOCALE, MAX_CONTENT_LANGUAGES, type ContentLanguageOption } from '~~/shared/contracts/content';

type DraftLanguage = Pick<ContentLanguageOption, 'code' | 'name' | 'isActive'>;

// Common choices; any other code can be typed in. Names are written in the language itself.
const SUGGESTIONS = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文（简体）' },
  { code: 'zh-tw', name: '中文（繁體）' },
  { code: 'th', name: 'ไทย' },
  { code: 'lo', name: 'ລາວ' },
  { code: 'km', name: 'ខ្មែរ' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
];

const schema = z.object({ languages: z.array(z.object({ name: formRules.requiredText(60) })) });

const { t } = useI18n();
const localePath = useLocalePath();
const confirm = useConfirm();

if (!useSystemAccess().canManageSettings.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const { data, isPending, hasFailed, errorMessage, refresh } = await useRouteResource('content-languages-all', () => fetchAllContentLanguages());
const draft = ref<DraftLanguage[]>([]);
const saving = useAppRequest(saveContentLanguages);
const form = useFormValidation(schema, () => ({ languages: draft.value }));

const saved = computed<DraftLanguage[]>(() => (data.value ?? []).map(({ code, name, isActive }) => ({ code, name, isActive })));
const savedCodes = computed(() => new Set(saved.value.map((language) => language.code)));
const isDirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(saved.value));
const availableSuggestions = computed(() => SUGGESTIONS.filter((suggestion) => !draft.value.some((language) => language.code === suggestion.code)));

const newLanguage = reactive({ code: '', name: '' });
const pickedSuggestion = ref('');
const isAddAttempted = ref(false);

function restore(): void {
  draft.value = saved.value.map((language) => ({ ...language }));
  form.reset();
}

watch(saved, restore, { immediate: true });
useUnsavedChanges(isDirty);

function move(index: number, step: number): void {
  const [language] = draft.value.splice(index, 1);

  if (language) {
    draft.value.splice(index + step, 0, language);
  }
}

// Switching a saved language off hides its boxes; it says first that what was written is kept.
async function toggleActive(language: DraftLanguage, isActive: boolean): Promise<void> {
  if (
    !isActive &&
    savedCodes.value.has(language.code) &&
    !(await confirm(t('settings.languages.offConfirm', { name: language.name }), {
      description: t('settings.languages.offImpact'),
      confirmLabel: t('settings.languages.offButton'),
    }))
  ) {
    return;
  }

  language.isActive = isActive;
}

function pickSuggestion(code: string): void {
  pickedSuggestion.value = code;

  const suggestion = SUGGESTIONS.find((candidate) => candidate.code === code);

  Object.assign(newLanguage, suggestion ? { ...suggestion } : { code: '', name: '' });
}

function addError(field: 'code' | 'name'): string {
  if (!isAddAttempted.value) {
    return '';
  }

  const code = newLanguage.code.trim().toLowerCase();

  if (field === 'name') {
    return newLanguage.name.trim() ? '' : t('validation.required');
  }
  if (!code) {
    return t('validation.required');
  }
  if (!CONTENT_LOCALE_PATTERN.test(code)) {
    return t('settings.languages.codeInvalid');
  }

  return draft.value.some((language) => language.code === code) ? t('settings.languages.codeTaken') : '';
}

function handleAdd(): void {
  isAddAttempted.value = true;

  if (addError('code') || addError('name')) {
    return;
  }

  draft.value.push({ code: newLanguage.code.trim().toLowerCase(), name: newLanguage.name.trim(), isActive: true });
  Object.assign(newLanguage, { code: '', name: '' });
  pickedSuggestion.value = '';
  isAddAttempted.value = false;
}

async function handleSave(): Promise<void> {
  if (!form.validate()) {
    return;
  }
  if (await saving.execute(draft.value.map((language) => ({ ...language, name: language.name.trim() })))) {
    await Promise.all([refresh(), loadContentLanguages()]);
  }
}

useSeoMeta({ title: () => t('settings.languages.title') });
</script>
