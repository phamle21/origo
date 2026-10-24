<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.settings'), to: localePath('/settings') }, { label: t('layout.sectionNav.systemPermissions') }]" />

  <div class="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
    <div class="flex max-w-3xl flex-col gap-2">
      <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <AppTileIcon name="admin" />
        {{ t('settings.permissionCatalog.systemTitle') }}
      </h1>
      <p class="text-content-muted">{{ t('settings.permissionCatalog.systemDescription') }}</p>
    </div>

    <AppPageSkeleton
      v-if="isPending && !catalog"
      variant="list"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />
    <PermissionCatalog
      v-else-if="catalog"
      scope="system"
      :catalog="catalog"
      :role-permissions="(roles ?? []).map((role) => role.permissions)"
      @saved="refresh()"
    />
  </div>
</template>

<script setup lang="ts">
import AppTopbar from '@/components/layout/AppTopbar.vue';
import PermissionCatalog from '@/components/settings/PermissionCatalog.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import { fetchPermissions, fetchSystemRoles } from '@/api/settings/settings';

const { t } = useI18n();
const localePath = useLocalePath();

if (!useSystemAccess().canManageSettings.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const { data: catalog, isPending, hasFailed, errorMessage, refresh } = await useRouteResource('permissions-system', () => fetchPermissions('system'));
const { data: roles } = await useRouteResource('system-roles', () => fetchSystemRoles());

useSeoMeta({ title: () => t('settings.permissionCatalog.systemTitle') });
</script>
