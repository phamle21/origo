<template>
  <AppTopbar
    :crumbs="[
      { label: t('layout.apps.settings'), to: localePath('/settings') },
      { label: t('layout.sectionNav.projectRoles'), to: localePath('/settings/project-roles') },
      { label: isNew ? t('settings.projectRoles.create') : roleName },
    ]"
  />

  <div class="flex flex-col gap-4 px-4 py-8 sm:px-6">
    <p
      v-if="!isNew && !role"
      class="text-content-muted"
    >
      {{ t('settings.projectRoles.notFound') }}
    </p>

    <AppFormCard
      v-else
      form-id="project-role-form"
      tile="members"
      :title="isNew ? t('settings.projectRoles.create') : roleName"
      :description="t('settings.projectRoles.description')"
      :error="saving.hasFailed.value && !saving.fieldErrors.value ? saving.errorMessage.value : ''"
      @submit="handleSubmit"
    >
      <AppFormSection
        :number="1"
        :title="t('settings.systemRoles.sections.identity')"
        :description="t('settings.projectRoles.identityHint')"
      >
        <AppLocalizedField
          v-model="draft.name"
          :label="t('settings.systemRoles.name')"
          :max-length="60"
          is-required
          :error-for="(locale) => form.error(`name.${locale}`)"
          @blur="(locale) => form.touch(`name.${locale}`)"
        />
        <AppLocalizedField
          v-model="draft.description"
          :label="t('settings.systemRoles.about')"
          :max-length="300"
          is-multiline
          :error-for="(locale) => form.error(`description.${locale}`)"
          @blur="(locale) => form.touch(`description.${locale}`)"
        />
      </AppFormSection>

      <AppFormSection
        :number="2"
        :title="t('settings.systemRoles.permissions')"
        :description="t('settings.projectRoles.permissionsHint')"
      >
        <PermissionChecklist
          v-model="draft.permissions"
          scope="project"
          :catalog="catalog ?? []"
          :label="t('settings.systemRoles.permissions')"
        />
        <p class="text-xs text-content-muted">{{ t('settings.projectRoles.managerRule') }}</p>
        <p
          v-if="saving.fieldErrors.value?.permissions"
          role="alert"
          class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {{ t('settings.projectRoles.managerError') }}
        </p>
      </AppFormSection>

      <template #actions>
        <NuxtLink
          :to="localePath('/settings/project-roles')"
          class="inline-flex min-h-10 items-center rounded-control border border-line bg-surface px-4 text-sm font-semibold hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >{{ t('common.actions.cancel') }}</NuxtLink
        >
        <AppButton
          type="submit"
          :is-disabled="saving.isPending.value || (!isNew && !isDirty)"
          >{{ saving.isPending.value ? t('common.actions.saving') : t('common.actions.save') }}</AppButton
        >
      </template>
    </AppFormCard>

    <AppUnsavedBar
      v-if="!isNew"
      class="max-w-5xl"
      :show="isDirty"
      :is-saving="saving.isPending.value"
      form="project-role-form"
      @discard="restore"
    />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import PermissionChecklist from '@/components/settings/PermissionChecklist.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppFormCard from '@/components/ui/AppFormCard.vue';
import AppFormSection from '@/components/ui/AppFormSection.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';
import { createProjectRole, fetchPermissions, fetchProjectRoles, updateProjectRole } from '@/api/settings/settings';
import { loadProjectRoles } from '@/composables/project/useProjectRoles';
import { resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';
import { emptyLocalizedText } from '@/utils/screen-draft';
import type { ProjectRoleOption, ProjectRolePayload } from '~~/shared/contracts/access';

const schema = z.object({ name: formRules.localized(60, true), description: formRules.localized(300, false) });

const { t } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const { contentLanguage } = useContentLanguage();

if (!useSystemAccess().canManageSettings.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const roleId = computed(() => String(route.params.role ?? ''));
const isNew = computed(() => roleId.value === 'new');
const { data: roles } = await useRouteResource('project-roles-settings', () => fetchProjectRoles(), { isBlocking: true });
const { data: catalog } = await useRouteResource('permissions-project', () => fetchPermissions('project'));
const role = computed(() => roles.value?.find((candidate) => candidate.id === roleId.value) ?? null);
const roleName = computed(() => (role.value ? resolveLocalizedText(role.value.name, contentLanguage.value.primary).value : '…'));

function toDraft(value: ProjectRoleOption | null): ProjectRolePayload {
  return value
    ? { name: { ...value.name }, description: { ...value.description }, permissions: [...value.permissions] }
    : { name: emptyLocalizedText(), description: emptyLocalizedText(), permissions: ['project.read'] };
}

const draft = reactive<ProjectRolePayload>(toDraft(role.value));
const saved = ref(JSON.stringify(toDraft(role.value)));
const isDirty = computed(() => JSON.stringify(draft) !== saved.value);

const saving = useAppRequest((payload: ProjectRolePayload) => (isNew.value ? createProjectRole(payload) : updateProjectRole(roleId.value, payload)));
const form = useFormValidation(schema, () => draft, { serverFields: saving.fieldErrors });

useUnsavedChanges(isDirty);

function restore(): void {
  Object.assign(draft, JSON.parse(saved.value) as ProjectRolePayload);
  form.reset();
}

async function handleSubmit(): Promise<void> {
  if (!form.validate()) {
    return;
  }
  if (await saving.execute(JSON.parse(JSON.stringify(draft)) as ProjectRolePayload)) {
    saved.value = JSON.stringify(draft);
    clearNuxtData('project-roles-settings');
    await loadProjectRoles();
    await navigateTo(localePath('/settings/project-roles'));
  }
}

useSeoMeta({ title: () => (isNew.value ? t('settings.projectRoles.create') : roleName.value) });
</script>
