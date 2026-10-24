<template>
  <AppTopbar
    :crumbs="[
      { label: t('project.list.title'), to: localePath('/projects') },
      { label: projectName, to: localePath(`/p/${code}`) },
      { label: t('editor.newScreen.title') },
    ]"
  />

  <div class="px-4 py-8 sm:px-6">
    <AppFormCard
      form-id="new-screen-form"
      tile="design"
      :title="t('editor.newScreen.title')"
      :description="t('editor.newScreen.description')"
      :error="hasFailed ? errorMessage : ''"
      @submit="handleSubmit"
    >
      <AppFormSection
        :number="1"
        :title="t('editor.newScreen.sections.name')"
        :description="t('editor.newScreen.sections.nameHint')"
      >
        <AppLocalizedField
          v-model="texts.name"
          :label="t('editor.fields.name')"
          :max-length="120"
          is-required
          :error-for="(locale) => form.error(`name.${locale}`)"
          @blur="(locale) => form.touch(`name.${locale}`)"
        />
        <AppLocalizedField
          v-model="texts.flow"
          :label="t('editor.fields.flow')"
          :max-length="120"
          :error-for="(locale) => form.error(`flow.${locale}`)"
          @blur="(locale) => form.touch(`flow.${locale}`)"
        />
      </AppFormSection>

      <AppFormSection
        :number="2"
        :title="t('editor.fields.purpose')"
        :description="t('editor.newScreen.sections.purposeHint')"
      >
        <AppLocalizedField
          v-model="texts.purpose"
          :label="t('editor.fields.purpose')"
          :max-length="1000"
          is-multiline
          :error-for="(locale) => form.error(`purpose.${locale}`)"
          @blur="(locale) => form.touch(`purpose.${locale}`)"
        />
      </AppFormSection>

      <AppFormSection
        :number="3"
        :title="t('editor.fields.image')"
        :description="t('editor.newScreen.sections.imageHint')"
      >
        <EditorScreenSourceInput v-model="source" />
        <p
          v-if="form.error('source')"
          class="text-xs font-medium text-danger"
        >
          {{ t('editor.newScreen.sourceRequired') }}
        </p>
        <p
          v-if="isPending && source?.kind !== 'image'"
          role="status"
          class="text-sm text-content-muted"
        >
          {{ t('editor.source.capturing') }}
        </p>
      </AppFormSection>

      <template #actions>
        <NuxtLink
          :to="localePath(`/p/${code}`)"
          class="inline-flex min-h-10 items-center rounded-control border border-line bg-surface px-4 text-sm font-semibold hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >{{ t('editor.actions.cancel') }}</NuxtLink
        >
        <AppButton
          type="submit"
          :is-disabled="isPending"
          >{{ isPending ? t('editor.newScreen.submitting') : t('editor.newScreen.submit') }}</AppButton
        >
      </template>
    </AppFormCard>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import { createScreen } from '@/api/screen/screen';
import EditorScreenSourceInput from '@/components/editor/EditorScreenSourceInput.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppFormCard from '@/components/ui/AppFormCard.vue';
import AppFormSection from '@/components/ui/AppFormSection.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import { localizedValues, resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';
import { emptyLocalizedText } from '@/utils/screen-draft';
import type { ScreenSourceInput, ScreenTextsPayload } from '~~/shared/contracts/screen-editor';

const schema = z.object({
  name: formRules.localized(120, true),
  flow: formRules.localized(120, false),
  purpose: formRules.localized(1_000, false),
  source: z.unknown().refine((value) => value !== null, { message: 'required' }),
});

const { t } = useI18n();
const localePath = useLocalePath();
const { code } = useProjectRoute();
const { contentLanguage } = useContentLanguage();

const { data: projectScreens } = await useProjectScreens(code, { isBlocking: true });

if (!projectScreens.value?.project.permissions.canEditDesign) {
  await navigateTo(localePath(`/p/${code.value}`), { replace: true });
}
const projectName = computed(() =>
  projectScreens.value ? resolveLocalizedText(projectScreens.value.project.name, contentLanguage.value.primary).value : code.value,
);

const texts = ref<ScreenTextsPayload>({ name: emptyLocalizedText(), flow: emptyLocalizedText(), purpose: emptyLocalizedText() });
const source = ref<ScreenSourceInput | null>(null);
const { errorMessage, hasFailed, isPending, execute } = useAppRequest(createScreen);
const form = useFormValidation(schema, () => ({ ...texts.value, source: source.value }));
const isCreated = ref(false);
const isDirty = computed(() => !isCreated.value && Boolean(source.value || Object.values(texts.value).some((text) => localizedValues(text).length > 0)));

useUnsavedChanges(isDirty);

async function handleSubmit(): Promise<void> {
  if (!form.validate() || !source.value) {
    return;
  }

  const created = await execute(code.value, texts.value, source.value);

  if (created) {
    isCreated.value = true;
    clearNuxtData([`project-screens:${code.value}`, `editor-context:${code.value}`]);
    await navigateTo(localePath(`/p/${code.value}/${created.code}/edit`));
  }
}

useSeoMeta({ title: () => t('editor.newScreen.title') });
</script>
