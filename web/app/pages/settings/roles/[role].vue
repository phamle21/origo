<template>
  <AppTopbar
    :crumbs="[
      { label: t('layout.apps.settings'), to: localePath('/settings') },
      { label: t('layout.sectionNav.systemRoles'), to: localePath('/settings/roles') },
      { label: isNew ? t('settings.systemRoles.create') : roleName },
    ]"
  />

  <div class="flex flex-col gap-4 px-4 py-8 sm:px-6">
    <p
      v-if="!isNew && !role"
      class="text-content-muted"
    >
      {{ t('settings.systemRoles.notFound') }}
    </p>

    <AppFormCard
      v-else
      form-id="system-role-form"
      tile="admin"
      :title="isNew ? t('settings.systemRoles.create') : roleName"
      :description="t('settings.systemRoles.description')"
      :error="saving.hasFailed.value && !saving.fieldErrors.value ? saving.errorMessage.value : ''"
      @submit="handleSubmit"
    >
      <AppFormSection
        :number="1"
        :title="t('settings.systemRoles.sections.identity')"
        :description="t('settings.systemRoles.sections.identityHint')"
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
        :description="t('settings.systemRoles.permissionsHint')"
      >
        <PermissionChecklist
          v-model="draft.permissions"
          scope="system"
          :catalog="catalog ?? []"
          :label="t('settings.systemRoles.permissions')"
        />
        <p class="text-xs text-content-muted">{{ t('settings.systemRoles.lockoutRule') }}</p>
        <p
          v-if="saving.fieldErrors.value?.permissions"
          role="alert"
          class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {{ t('settings.systemRoles.lockoutError') }}
        </p>
      </AppFormSection>

      <AppFormSection
        :number="3"
        :title="t('settings.systemRoles.defaultTitle')"
        :description="t('settings.systemRoles.defaultHint')"
      >
        <label
          :class="[
            'flex items-start gap-3 rounded-control border-2 px-4 py-3',
            role?.isDefault ? 'cursor-not-allowed border-line bg-surface-muted' : 'cursor-pointer border-line hover:border-accent',
          ]"
        >
          <AppCheckbox
            :model-value="draft.isDefault"
            :is-disabled="role?.isDefault"
            @update:model-value="draft.isDefault = $event"
          />
          <span class="flex flex-col gap-0.5 text-sm">
            <span class="font-semibold">{{ t('settings.systemRoles.defaultLabel') }}</span>
            <span
              v-if="role?.isDefault"
              class="text-content-muted"
              >{{ t('settings.systemRoles.defaultLocked') }}</span
            >
          </span>
        </label>
      </AppFormSection>

      <template #actions>
        <NuxtLink
          :to="localePath('/settings/roles')"
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
      form="system-role-form"
      @discard="restore"
    />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import PermissionChecklist from '@/components/settings/PermissionChecklist.vue';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppFormCard from '@/components/ui/AppFormCard.vue';
import AppFormSection from '@/components/ui/AppFormSection.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';
import { createSystemRole, fetchPermissions, fetchSystemRoles, updateSystemRole } from '@/api/settings/settings';
import { resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';
import { emptyLocalizedText } from '@/utils/screen-draft';
import type { SystemRole, SystemRolePayload } from '~~/shared/contracts/access';

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
const { data: roles } = await useRouteResource('system-roles', () => fetchSystemRoles(), { isBlocking: true });
const { data: catalog } = await useRouteResource('permissions-system', () => fetchPermissions('system'));
const role = computed(() => roles.value?.find((candidate) => candidate.id === roleId.value) ?? null);
const roleName = computed(() => (role.value ? resolveLocalizedText(role.value.name, contentLanguage.value.primary).value : '…'));

function toDraft(value: SystemRole | null): SystemRolePayload {
  return value
    ? { name: { ...value.name }, description: { ...value.description }, permissions: [...value.permissions], isDefault: value.isDefault }
    : { name: emptyLocalizedText(), description: emptyLocalizedText(), permissions: [], isDefault: false };
}

const draft = reactive<SystemRolePayload>(toDraft(role.value));
const saved = ref(JSON.stringify(toDraft(role.value)));
const isDirty = computed(() => JSON.stringify(draft) !== saved.value);

const saving = useAppRequest((payload: SystemRolePayload) => (isNew.value ? createSystemRole(payload) : updateSystemRole(roleId.value, payload)));
const form = useFormValidation(schema, () => draft, { serverFields: saving.fieldErrors });

useUnsavedChanges(isDirty);

function restore(): void {
  Object.assign(draft, JSON.parse(saved.value) as SystemRolePayload);
  form.reset();
}

async function handleSubmit(): Promise<void> {
  if (!form.validate()) {
    return;
  }
  if (await saving.execute(JSON.parse(JSON.stringify(draft)) as SystemRolePayload)) {
    saved.value = JSON.stringify(draft);
    clearNuxtData('system-roles');
    await navigateTo(localePath('/settings/roles'));
  }
}

useSeoMeta({ title: () => (isNew.value ? t('settings.systemRoles.create') : roleName.value) });
</script>
