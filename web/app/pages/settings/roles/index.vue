<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.settings'), to: localePath('/settings') }, { label: t('layout.sectionNav.systemRoles') }]">
    <NuxtLink
      :to="localePath('/settings/roles/new')"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-control bg-accent px-3.5 text-sm font-semibold text-accent-contrast hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <AppIcon name="plus" />
      {{ t('settings.systemRoles.create') }}
    </NuxtLink>
  </AppTopbar>

  <div class="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
    <div class="flex max-w-3xl flex-col gap-2">
      <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <AppTileIcon name="admin" />
        {{ t('settings.systemRoles.title') }}
      </h1>
      <p class="text-content-muted">{{ t('settings.systemRoles.description') }}</p>
    </div>

    <AppPageSkeleton
      v-if="isPending && !roles"
      variant="table"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <RoleTable
      v-else-if="roles"
      :roles="rows"
      :catalog="catalog ?? []"
      :edit-path="localePath('/settings/roles')"
      :count-label="t('settings.systemRoles.people')"
      :empty-permissions="t('settings.systemRoles.nothingExtra')"
      :delete-rule="t('settings.systemRoles.deleteRule')"
      @delete="handleDelete"
    />

    <p
      v-if="deleting.hasFailed.value"
      role="alert"
      class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ deleting.errorMessage.value }}
    </p>
  </div>
</template>

<script setup lang="ts">
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import RoleTable from '@/components/settings/RoleTable.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import { deleteSystemRole, fetchPermissions, fetchSystemRoles } from '@/api/settings/settings';
import { resolveLocalizedText } from '@/utils/content-language';

const { t } = useI18n();
const localePath = useLocalePath();
const { contentLanguage } = useContentLanguage();

if (!useSystemAccess().canManageSettings.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const { data: roles, isPending, hasFailed, errorMessage, refresh } = await useRouteResource('system-roles', () => fetchSystemRoles());
const { data: catalog } = await useRouteResource('permissions-system', () => fetchPermissions('system'));
const deleting = useAppRequest(deleteSystemRole);
const confirm = useConfirm();

const rows = computed(() => (roles.value ?? []).map((role) => ({ ...role, count: role.userCount })));

async function handleDelete(roleId: string): Promise<void> {
  const role = roles.value?.find((candidate) => candidate.id === roleId);
  const name = role ? resolveLocalizedText(role.name, contentLanguage.value.primary).value : '';
  const isConfirmed = await confirm(t('settings.systemRoles.deleteConfirm', { name }), {
    confirmLabel: t('settings.systemRoles.delete'),
    tone: 'danger',
  });

  if (isConfirmed && (await deleting.execute(roleId))) {
    await refresh();
  }
}

useSeoMeta({ title: () => t('settings.systemRoles.title') });
</script>
