<template>
  <AppTopbar
    :crumbs="[
      { label: t('layout.apps.projects'), to: localePath('/projects') },
      { label: t('layout.sectionNav.allProjects'), to: localePath('/admin/projects') },
      { label: t('admin.projects.create') },
    ]"
  />

  <div class="px-4 py-8 sm:px-6">
    <AppFormCard
      form-id="project-form"
      tile="projects"
      :title="t('admin.projects.create')"
      :description="t('admin.projects.description')"
      :error="hasFailed && !fieldErrors ? errorMessage : ''"
      @submit="handleSubmit"
    >
      <AppFormSection
        :number="1"
        :title="t('admin.projects.sections.code')"
        :description="t('admin.projects.codeHint')"
      >
        <AppTextField
          v-model="draft.code"
          class="max-w-xs font-mono uppercase"
          :label="t('admin.projects.code')"
          :max-length="16"
          is-required
          autocomplete="off"
          :error="form.error('code')"
          @blur="form.touch('code')"
        />
      </AppFormSection>

      <AppFormSection
        :number="2"
        :title="t('admin.projects.sections.about')"
        :description="t('admin.projects.sections.aboutHint')"
      >
        <AppLocalizedField
          v-model="draft.name"
          :label="t('admin.projects.name')"
          :max-length="160"
          is-required
          :error-for="(locale) => form.error(`name.${locale}`)"
          @blur="(locale) => form.touch(`name.${locale}`)"
        />
        <AppLocalizedField
          v-model="draft.description"
          :label="t('admin.projects.about')"
          :max-length="5000"
          is-multiline
          :rows="3"
          :error-for="(locale) => form.error(`description.${locale}`)"
          @blur="(locale) => form.touch(`description.${locale}`)"
        />
      </AppFormSection>

      <AppFormSection
        :number="3"
        :title="t('admin.projects.manager')"
        :description="t('admin.projects.managerHint')"
      >
        <div
          v-if="draft.manager"
          class="flex min-h-10 items-center justify-between gap-2 rounded-control border border-accent bg-accent-soft px-3"
        >
          <span class="min-w-0 text-sm break-words">
            <strong>{{ draft.manager.name }}</strong> · {{ draft.manager.email }}
          </span>
          <button
            type="button"
            class="text-sm font-semibold text-accent-strong hover:underline"
            @click="draft.manager = null"
          >
            {{ t('team.add.change') }}
          </button>
        </div>
        <UserPicker
          v-else
          :label="t('admin.projects.manager')"
          :search="lookupUsers"
          @pick="draft.manager = $event"
        />
      </AppFormSection>

      <template #actions>
        <NuxtLink
          :to="localePath('/admin/projects')"
          class="inline-flex min-h-10 items-center rounded-control border border-line bg-surface px-4 text-sm font-semibold hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >{{ t('common.actions.cancel') }}</NuxtLink
        >
        <AppButton
          type="submit"
          :is-disabled="isPending"
          >{{ isPending ? t('common.actions.saving') : t('admin.projects.submit') }}</AppButton
        >
      </template>
    </AppFormCard>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import UserPicker from '@/components/team/UserPicker.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppFormCard from '@/components/ui/AppFormCard.vue';
import AppFormSection from '@/components/ui/AppFormSection.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import AppTextField from '@/components/ui/AppTextField.vue';
import { createProject, lookupUsers } from '@/api/team/team';
import { localizedValues } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';
import { emptyLocalizedText } from '@/utils/screen-draft';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { UserOption } from '~~/shared/contracts/member';

const schema = z.object({
  code: formRules.projectCode(),
  name: formRules.localized(160, true),
  description: formRules.localized(5_000, false),
});

const { t } = useI18n();
const localePath = useLocalePath();
const { canCreateProjects } = useSystemAccess();

if (!canCreateProjects.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const draft = reactive<{ code: string; name: LocalizedText; description: LocalizedText; manager: UserOption | null }>({
  code: '',
  name: emptyLocalizedText(),
  description: emptyLocalizedText(),
  manager: null,
});
const { hasFailed, errorMessage, fieldErrors, isPending, execute } = useAppRequest(createProject);
const form = useFormValidation(schema, () => draft, { serverFields: fieldErrors });
const isSaved = ref(false);

const isDirty = computed(
  () => Boolean(draft.code.trim() || localizedValues(draft.name).length || localizedValues(draft.description).length || draft.manager) && !isSaved.value,
);

useUnsavedChanges(isDirty);

async function handleSubmit(): Promise<void> {
  if (!form.validate()) {
    return;
  }

  const result = await execute({
    code: draft.code.trim().toUpperCase(),
    name: draft.name,
    description: draft.description,
    managerId: draft.manager?.id ?? null,
  });

  if (result) {
    isSaved.value = true;
    clearNuxtData('project-list');
    await navigateTo(localePath(`/p/${result.code}/members`));
  }
}

useSeoMeta({ title: () => t('admin.projects.create') });
</script>
