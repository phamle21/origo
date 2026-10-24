<template>
  <AppTopbar
    :crumbs="[
      { label: t('layout.apps.settings'), to: localePath('/settings') },
      { label: t('layout.sectionNav.users'), to: localePath('/settings/users') },
      { label: user?.name ?? '…' },
    ]"
  />

  <div class="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
    <AppErrorNotice
      v-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refreshAll()"
    />

    <template v-else-if="user">
      <div class="flex flex-wrap items-center gap-4">
        <AppAvatar :initials="user.initials" />
        <div class="flex min-w-0 flex-col gap-1">
          <h1 class="text-3xl font-bold tracking-tight break-words">{{ user.name }}</h1>
          <p class="flex flex-wrap items-center gap-2 text-content-muted">
            <span class="break-all">{{ user.email }}</span>
            <AppBadge :tone="user.isAdmin ? 'accent' : 'neutral'">{{ roleName }}</AppBadge>
            <AppBadge :tone="user.isActive ? 'success' : 'danger'">{{ t(user.isActive ? 'admin.users.active' : 'team.locked') }}</AppBadge>
          </p>
        </div>
      </div>

      <p
        v-if="actionError"
        role="alert"
        class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
      >
        {{ actionError }}
      </p>
      <IssuedPasswordNotice
        v-if="issuedPassword"
        :name="user.name"
        :password="issuedPassword"
        @dismiss="issuedPassword = null"
      />

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="flex min-w-0 flex-col gap-6">
          <section class="flex flex-col rounded-card border border-line bg-surface shadow-card">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-4">
              <h2 class="flex items-center gap-2 text-lg font-semibold">
                <AppIcon name="folder" />
                {{ t('admin.person.projects') }}
              </h2>
              <span class="text-sm text-content-muted">{{ t('admin.person.projectsHint') }}</span>
            </div>

            <ul
              v-if="memberships?.length"
              class="divide-y divide-line"
            >
              <li
                v-for="membership in memberships"
                :key="membership.memberId"
                class="flex flex-wrap items-center gap-3 px-6 py-3"
              >
                <NuxtLink
                  :to="localePath(`/p/${membership.project.code}/members`)"
                  class="flex min-w-0 flex-1 flex-col leading-tight hover:text-accent-strong"
                >
                  <span class="font-mono text-xs font-semibold text-content-muted">{{ membership.project.code }}</span>
                  <AppLocalizedText
                    :text="membership.project.name"
                    class="font-semibold"
                  />
                </NuxtLink>
                <label
                  class="sr-only"
                  :for="`role-${membership.memberId}`"
                  >{{ t('admin.person.roleIn', { code: membership.project.code }) }}</label
                >
                <AppSelect
                  :id="`role-${membership.memberId}`"
                  :model-value="membership.role"
                  size="sm"
                  class="min-w-44"
                  :options="roleOptions"
                  @update:model-value="handleRoleChange(membership, String($event))"
                />
                <AppButton
                  variant="danger"
                  @click="handleRemove(membership)"
                  >{{ t('team.remove') }}</AppButton
                >
              </li>
            </ul>
            <p
              v-else
              class="px-6 py-6 text-sm text-content-muted"
            >
              {{ t('admin.person.noProjects') }}
            </p>

            <form
              v-if="availableProjects.length"
              class="flex flex-wrap items-end gap-3 rounded-b-card border-t border-line bg-surface-muted px-6 py-4"
              @submit.prevent="handleAssign"
            >
              <label class="flex min-w-48 flex-1 flex-col gap-1 text-xs font-semibold text-content-muted">
                {{ t('admin.person.assignProject') }}
                <AppSelect
                  v-model="assignCode"
                  class="w-full font-normal"
                  :placeholder="t('admin.person.chooseProject')"
                  :options="
                    availableProjects.map((project) => ({
                      value: project.code,
                      label: resolveLocalizedText(project.name, contentLanguage.primary).value,
                      hint: project.code,
                    }))
                  "
                />
              </label>
              <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
                {{ t('team.role') }}
                <AppSelect
                  v-model="assignRole"
                  class="w-full font-normal"
                  :options="roleOptions"
                />
              </label>
              <AppButton
                type="submit"
                :is-disabled="!assignCode"
              >
                <span class="inline-flex items-center gap-1.5"><AppIcon name="plus" />{{ t('admin.person.assign') }}</span>
              </AppButton>
            </form>
          </section>

          <form
            id="person-profile-form"
            novalidate
            class="flex flex-col rounded-card border border-line bg-surface shadow-card"
            @submit.prevent="handleSaveProfile"
          >
            <h2 class="flex items-center gap-2 border-b border-line px-6 py-4 text-lg font-semibold">
              <AppIcon name="user" />
              {{ t('admin.person.profile') }}
            </h2>
            <div class="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3">
              <AppTextField
                v-model="profile.name"
                :label="t('admin.users.name')"
                :max-length="120"
                is-required
                :error="form.error('name')"
                @blur="form.touch('name')"
              />
              <AppTextField
                v-model="profile.email"
                type="email"
                :label="t('admin.users.email')"
                :max-length="255"
                is-required
                :error="form.error('email')"
                @blur="form.touch('email')"
              />
              <AppTextField
                v-model="profile.title"
                :label="t('admin.users.jobTitle')"
                :max-length="40"
                :error="form.error('title')"
                @blur="form.touch('title')"
              />
            </div>
            <div class="flex justify-end rounded-b-card border-t border-line bg-surface-muted px-6 py-3">
              <AppButton
                type="submit"
                :is-disabled="!isProfileDirty || updating.isPending.value"
                >{{ t('common.actions.save') }}</AppButton
              >
            </div>
          </form>
        </div>

        <aside class="flex flex-col rounded-card border border-line bg-surface shadow-card">
          <h2 class="flex items-center gap-2 border-b border-line px-6 py-4 text-lg font-semibold">
            <AppIcon name="shield" />
            {{ t('admin.person.access') }}
          </h2>
          <div class="flex flex-col divide-y divide-line">
            <div class="flex flex-col gap-2 px-6 py-4">
              <label
                class="text-sm font-semibold"
                for="system-role"
                >{{ t('settings.systemRoles.role') }}</label
              >
              <AppSelect
                id="system-role"
                :model-value="user.systemRole?.id ?? ''"
                class="w-full"
                :is-disabled="isSelf"
                :options="(roles ?? []).map((role) => ({ value: role.id, label: resolveLocalizedText(role.name, contentLanguage.primary).value }))"
                @update:model-value="handleUpdate({ systemRoleId: String($event) })"
              />
              <ul
                v-if="user.permissions.length"
                class="flex flex-col gap-1 text-sm"
              >
                <li
                  v-for="permission in user.permissions"
                  :key="permission"
                  class="flex items-center gap-1.5 text-success"
                >
                  <AppIcon
                    name="check"
                    :size="14"
                  />
                  <span class="text-content">{{ permissionName(permission) }}</span>
                </li>
              </ul>
              <p
                v-else
                class="text-sm text-content-muted"
              >
                {{ t('admin.person.noSystemPermissions') }}
              </p>
              <NuxtLink
                v-if="canManageSettings"
                :to="localePath('/settings/roles')"
                class="text-sm font-semibold text-accent-strong hover:underline"
                >{{ t('admin.person.editRoles') }}</NuxtLink
              >
            </div>
            <div class="m-4 flex flex-col gap-4 rounded-card border-2 border-danger/40 bg-danger-soft/40 p-4">
              <p class="flex items-center gap-2 text-sm font-bold text-danger">
                <AppIcon
                  name="shield"
                  :size="16"
                />{{ t('admin.person.dangerZone') }}
              </p>
              <div class="flex flex-col gap-2">
                <p class="text-sm font-semibold">{{ t('admin.person.lockTitle') }}</p>
                <p class="text-sm text-content-muted">{{ t('admin.person.lockHint') }}</p>
                <AppButton
                  :variant="user.isActive ? 'danger' : 'secondary'"
                  :is-disabled="isSelf"
                  @click="handleToggleLock"
                >
                  <span class="inline-flex items-center gap-1.5"
                    ><AppIcon :name="user.isActive ? 'lock' : 'unlock'" />{{ t(user.isActive ? 'admin.users.lock' : 'admin.users.unlock') }}</span
                  >
                </AppButton>
              </div>
              <div class="flex flex-col gap-2 border-t border-danger/30 pt-4">
                <p class="text-sm font-semibold">{{ t('admin.users.resetPassword') }}</p>
                <p class="text-sm text-content-muted">{{ t('admin.person.resetHint') }}</p>
                <AppButton
                  variant="danger"
                  @click="handleReset"
                >
                  <span class="inline-flex items-center gap-1.5"><AppIcon name="key" />{{ t('admin.users.resetPassword') }}</span>
                </AppButton>
              </div>
            </div>
          </div>
          <p
            v-if="isSelf"
            class="rounded-b-card border-t border-line bg-surface-muted px-6 py-3 text-xs text-content-muted"
          >
            {{ t('admin.person.selfNote') }}
          </p>
        </aside>
      </div>

      <AppUnsavedBar
        :show="isProfileDirty"
        :is-saving="updating.isPending.value"
        form="person-profile-form"
        :hint="t('admin.person.unsavedHint')"
        @discard="restoreProfile"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import { z } from 'zod';
import IssuedPasswordNotice from '@/components/admin/IssuedPasswordNotice.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import AppTextField from '@/components/ui/AppTextField.vue';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';
import { fetchProjectList } from '@/api/project/project';
import { fetchPermissions, fetchSystemRoles } from '@/api/settings/settings';
import {
  addProjectMember,
  changeProjectMemberRole,
  fetchAdminUser,
  fetchUserMemberships,
  removeProjectMember,
  resetAccountPassword,
  updateAccount,
} from '@/api/team/team';
import { resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';
import type { SystemPermission } from '~~/shared/contracts/access';
import type { UpdateAccountPayload, UserMembership } from '~~/shared/contracts/member';
import type { ProjectRole } from '~~/shared/contracts/project';

const profileSchema = z.object({ name: formRules.requiredText(120), email: formRules.email(), title: formRules.optionalText(40) });

const { t } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const currentUser = useCurrentUser();
const { contentLanguage } = useContentLanguage();
const { canManageUsers, canManageSettings } = useSystemAccess();

if (!canManageUsers.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const parsedId = z.coerce.number().int().positive().safeParse(route.params.user);

if (!parsedId.success) {
  throw createError({ statusCode: 404, fatal: true });
}

const userId = parsedId.data;
const {
  data: user,
  hasFailed,
  errorMessage,
  refresh: refreshUser,
} = await useRouteResource(`admin-user:${userId}`, () => fetchAdminUser(userId), { isBlocking: true });
const { data: memberships, refresh: refreshMemberships } = await useRouteResource(`admin-user-projects:${userId}`, () => fetchUserMemberships(userId), {
  isBlocking: true,
});
const { data: projects } = await useRouteResource('project-list', () => fetchProjectList(), { isBlocking: true });
const { data: roles } = await useRouteResource('system-roles', () => fetchSystemRoles(), { isBlocking: true });
const { data: systemPermissions } = await useRouteResource('permissions-system', () => fetchPermissions('system'));

const profile = reactive({ name: '', email: '', title: '' });
const assignCode = ref('');
const { roles: projectRoles, nameOf } = useProjectRoles();
const assignRole = ref<ProjectRole>(projectRoles.value.find((role) => role.permissions.length === 1)?.key ?? projectRoles.value.at(-1)?.key ?? '');
const issuedPassword = ref<string | null>(null);

const savedProfile = computed(() => ({ name: user.value?.name ?? '', email: user.value?.email ?? '', title: user.value?.title ?? '' }));
const isProfileDirty = computed(() => JSON.stringify(profile) !== JSON.stringify(savedProfile.value));

// Reloading the person (after a role change, say) refreshes the form only while it holds no edits.
watch(
  savedProfile,
  (next, previous) => {
    if (!previous || JSON.stringify(profile) === JSON.stringify(previous)) {
      Object.assign(profile, next);
    }
  },
  { immediate: true },
);

function restoreProfile(): void {
  Object.assign(profile, savedProfile.value);
  form.reset();
}

const isSelf = computed(() => user.value?.email === currentUser.value?.email);
const roleName = computed(() => (user.value?.systemRole ? resolveLocalizedText(user.value.systemRole.name, contentLanguage.value.primary).value : '—'));
// Only projects whose members this person may manage can be offered; the API checks the same.
const availableProjects = computed(() => {
  const joined = new Set(memberships.value?.map((membership) => membership.project.code));

  return (projects.value ?? []).filter((project) => !joined.has(project.code) && project.permissions.canManageMembers);
});

function permissionName(permission: SystemPermission): string {
  const entry = systemPermissions.value?.find((candidate) => candidate.key === permission);

  return entry ? resolveLocalizedText(entry.name, contentLanguage.value.primary).value : permission;
}

const roleOptions = computed(() => projectRoles.value.map((role) => ({ value: role.key, label: nameOf(role.key) })));

const assigning = useAppRequest(addProjectMember);
const changing = useAppRequest(changeProjectMemberRole);
const removing = useAppRequest(removeProjectMember);
const updating = useAppRequest(updateAccount);
const form = useFormValidation(profileSchema, () => profile, { serverFields: updating.fieldErrors });
const confirm = useConfirm();

useUnsavedChanges(isProfileDirty);
const resetting = useAppRequest(resetAccountPassword);
const actionError = computed(
  () =>
    assigning.errorMessage.value || changing.errorMessage.value || removing.errorMessage.value || updating.errorMessage.value || resetting.errorMessage.value,
);

async function refreshAll(): Promise<void> {
  await Promise.all([refreshUser(), refreshMemberships()]);
}

async function handleAssign(): Promise<void> {
  if (assignCode.value && (await assigning.execute(assignCode.value, userId, assignRole.value))) {
    assignCode.value = '';
    await refreshAll();
  }
}

async function handleRoleChange(membership: UserMembership, role: ProjectRole): Promise<void> {
  await changing.execute(membership.project.code, membership.memberId, role);
  await refreshMemberships();
}

async function handleRemove(membership: UserMembership): Promise<void> {
  if (
    await confirm(t('admin.person.removeConfirm', { code: membership.project.code }), {
      description: t('admin.person.removeImpact'),
      confirmLabel: t('team.remove'),
      tone: 'danger',
    })
  ) {
    await removing.execute(membership.project.code, membership.memberId);
    await refreshAll();
  }
}

async function handleUpdate(change: UpdateAccountPayload): Promise<void> {
  await updating.execute(userId, change);
  await refreshUser();
}

async function handleSaveProfile(): Promise<void> {
  if (form.validate()) {
    await handleUpdate({ name: profile.name.trim(), email: profile.email.trim(), title: profile.title.trim() || null });
  }
}

async function handleToggleLock(): Promise<void> {
  if (
    user.value?.isActive &&
    !(await confirm(t('admin.users.lockConfirm', { name: user.value.name }), {
      description: t('admin.person.lockImpact', { count: memberships.value?.length ?? 0 }),
      confirmLabel: t('admin.users.lock'),
      tone: 'danger',
    }))
  ) {
    return;
  }
  await handleUpdate({ isActive: !user.value?.isActive });
}

async function handleReset(): Promise<void> {
  if (
    user.value &&
    (await confirm(t('admin.users.resetConfirm', { name: user.value.name }), {
      description: t('admin.person.resetImpact'),
      confirmLabel: t('admin.users.resetPassword'),
      tone: 'danger',
    }))
  ) {
    issuedPassword.value = (await resetting.execute(userId))?.temporaryPassword ?? null;
  }
}

useSeoMeta({ title: () => user.value?.name ?? t('admin.users.title') });
</script>
