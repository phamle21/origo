<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.settings'), to: localePath('/settings') }, { label: t('layout.sectionNav.users') }]">
    <AppButton @click="isCreating ? handleCancel() : (isCreating = true)">
      <span class="inline-flex items-center gap-1.5"><AppIcon name="plus" />{{ t('admin.users.create') }}</span>
    </AppButton>
  </AppTopbar>

  <div class="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
    <div class="flex max-w-3xl flex-col gap-2">
      <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <AppTileIcon name="people" />
        {{ t('admin.users.title') }}
      </h1>
      <p class="text-content-muted">{{ t('admin.users.description') }}</p>
    </div>

    <AppFormCard
      v-if="isCreating"
      form-id="account-form"
      tile="people"
      :title="t('admin.users.create')"
      :description="t('admin.users.createHint')"
      :error="creating.hasFailed.value && !creating.fieldErrors.value ? creating.errorMessage.value : ''"
      @submit="handleCreate"
    >
      <AppFormSection
        :number="1"
        :title="t('admin.users.sections.person')"
        :description="t('admin.users.sections.personHint')"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppTextField
            v-model="draft.name"
            :label="t('admin.users.name')"
            :max-length="120"
            is-required
            autocomplete="off"
            :error="form.error('name')"
            @blur="form.touch('name')"
          />
          <AppTextField
            v-model="draft.email"
            type="email"
            :label="t('admin.users.email')"
            :max-length="255"
            is-required
            autocomplete="off"
            :error="form.error('email')"
            @blur="form.touch('email')"
          />
          <AppTextField
            v-model="draft.title"
            :label="t('admin.users.jobTitle')"
            :max-length="40"
            :placeholder="t('admin.users.jobTitlePlaceholder')"
            :error="form.error('title')"
            @blur="form.touch('title')"
          />
        </div>
      </AppFormSection>

      <AppFormSection
        :number="2"
        :title="t('settings.systemRoles.role')"
        :description="t('settings.systemRoles.roleHint')"
      >
        <label class="flex max-w-sm flex-col gap-1.5 text-sm font-semibold">
          {{ t('settings.systemRoles.role') }}
          <AppSelect
            v-model="draft.systemRoleId"
            class="w-full font-normal"
            :options="(roles ?? []).map((role) => ({ value: role.id, label: resolveLocalizedText(role.name, contentLanguage.primary).value }))"
          />
        </label>
      </AppFormSection>

      <template #actions>
        <AppButton
          variant="secondary"
          @click="handleCancel"
          >{{ t('common.actions.cancel') }}</AppButton
        >
        <AppButton
          type="submit"
          :is-disabled="creating.isPending.value"
          >{{ creating.isPending.value ? t('common.actions.saving') : t('admin.users.createSubmit') }}</AppButton
        >
      </template>
    </AppFormCard>

    <IssuedPasswordNotice
      v-if="issued"
      :name="issued.name"
      :password="issued.password"
      @dismiss="issued = null"
    />

    <section class="flex flex-col rounded-card border border-line bg-surface shadow-card">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 class="text-lg font-semibold">
          {{ t('admin.users.list') }}
          <span
            v-if="users"
            class="ml-1 text-sm font-normal text-content-muted"
            >({{ users.length }})</span
          >
        </h2>
        <label class="relative w-full sm:w-80">
          <span class="sr-only">{{ t('admin.users.search') }}</span>
          <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-content-muted"><AppIcon name="search" /></span>
          <input
            v-model="query"
            type="search"
            maxlength="100"
            :placeholder="t('admin.users.searchPlaceholder')"
            class="min-h-10 w-full rounded-control border border-line-strong bg-surface pr-3 pl-10 text-sm"
          />
        </label>
      </div>

      <AppPageSkeleton
        v-if="isPending && !users"
        variant="rows"
      />
      <div
        v-else-if="hasFailed"
        class="p-6"
      >
        <AppErrorNotice
          :message="errorMessage"
          :retry-label="t('common.actions.retry')"
          @retry="refresh()"
        />
      </div>
      <p
        v-else-if="users && !users.length"
        class="px-6 py-10 text-center text-sm text-content-muted"
      >
        {{ t('admin.users.noMatch') }}
      </p>
      <div
        v-else-if="users"
        class="overflow-x-auto"
      >
        <table class="w-full min-w-[44rem] text-sm">
          <thead class="bg-surface-muted text-left text-xs font-semibold text-content-muted">
            <tr>
              <th
                scope="col"
                class="px-6 py-3"
              >
                {{ t('admin.users.columns.person') }}
              </th>
              <th
                scope="col"
                class="px-3 py-3"
              >
                {{ t('admin.users.jobTitle') }}
              </th>
              <th
                scope="col"
                class="px-3 py-3"
              >
                {{ t('admin.users.columns.access') }}
              </th>
              <th
                scope="col"
                class="px-3 py-3 text-right"
              >
                {{ t('admin.users.columns.projects') }}
              </th>
              <th
                scope="col"
                class="px-3 py-3"
              >
                {{ t('admin.users.columns.status') }}
              </th>
              <th
                scope="col"
                class="px-6 py-3"
              >
                <span class="sr-only">{{ t('admin.users.columns.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr
              v-for="user in users"
              :key="user.id"
              :class="user.isActive ? 'hover:bg-surface-muted' : 'bg-surface-muted text-content-muted'"
            >
              <td class="px-6 py-3">
                <div class="flex items-center gap-3">
                  <AppAvatar :initials="user.initials" />
                  <div class="flex min-w-0 flex-col leading-tight">
                    <span class="font-semibold break-words text-content">{{ user.name }}</span>
                    <span class="break-all text-content-muted">{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3">{{ user.title || '—' }}</td>
              <td class="px-3 py-3">
                <AppBadge :tone="user.isAdmin ? 'accent' : user.permissions.length ? 'info' : 'neutral'">{{
                  user.systemRole ? resolveLocalizedText(user.systemRole.name, contentLanguage.primary).value : '—'
                }}</AppBadge>
              </td>
              <td class="px-3 py-3 text-right tabular-nums">{{ user.projectCount }}</td>
              <td class="px-3 py-3">
                <AppBadge :tone="user.isActive ? 'success' : 'danger'">{{ t(user.isActive ? 'admin.users.active' : 'team.locked') }}</AppBadge>
              </td>
              <td class="px-6 py-3 text-right">
                <NuxtLink
                  :to="localePath(`/settings/users/${user.id}`)"
                  class="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-content hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {{ t('admin.users.manage') }}
                  <AppIcon
                    name="arrowRight"
                    :size="16"
                  />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="users && users.length >= PAGE_SIZE"
        class="border-t border-line px-6 py-3 text-xs text-content-muted"
      >
        {{ t('admin.users.firstPage', { count: PAGE_SIZE }) }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import { z } from 'zod';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import AppFormCard from '@/components/ui/AppFormCard.vue';
import AppFormSection from '@/components/ui/AppFormSection.vue';
import AppTextField from '@/components/ui/AppTextField.vue';
import IssuedPasswordNotice from '@/components/admin/IssuedPasswordNotice.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { fetchSystemRoles } from '@/api/settings/settings';
import { createAccount, fetchAdminUsers } from '@/api/team/team';
import { resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';

const schema = z.object({ name: formRules.requiredText(120), email: formRules.email(), title: formRules.optionalText(40) });

// Matches the API page size; the search narrows larger teams.
const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MILLISECONDS = 300;

const { t } = useI18n();
const localePath = useLocalePath();
const { contentLanguage } = useContentLanguage();
const { canManageUsers } = useSystemAccess();

if (!canManageUsers.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const query = ref('');
const { data: users, isPending, hasFailed, errorMessage, refresh } = await useRouteResource('admin-users', () => fetchAdminUsers(query.value.trim()));

let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(query, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => refresh(), SEARCH_DEBOUNCE_MILLISECONDS);
});
onBeforeUnmount(() => clearTimeout(searchTimer));

const isCreating = ref(false);
const { data: roles } = await useRouteResource('system-roles', () => fetchSystemRoles());
const memberRoleId = computed(() => roles.value?.find((role) => role.key === 'member')?.id ?? null);
const draft = reactive<{ name: string; email: string; title: string; systemRoleId: string | null }>({ name: '', email: '', title: '', systemRoleId: null });

// New accounts start as plain members unless the admin picks something else.
watch(memberRoleId, (id) => (draft.systemRoleId ??= id), { immediate: true });
const issued = ref<{ name: string; password: string } | null>(null);
const creating = useAppRequest(createAccount);
const form = useFormValidation(schema, () => draft, { serverFields: creating.fieldErrors });
const confirm = useConfirm();
const isDirty = computed(() => isCreating.value && Boolean(draft.name.trim() || draft.email.trim() || draft.title.trim()));

useUnsavedChanges(isDirty);

function closeForm(): void {
  Object.assign(draft, { name: '', email: '', title: '', systemRoleId: memberRoleId.value });
  form.reset();
  creating.reset();
  isCreating.value = false;
}

async function handleCancel(): Promise<void> {
  if (
    !isDirty.value ||
    (await confirm(t('common.unsaved.closeTitle'), {
      description: t('common.unsaved.closeDescription'),
      confirmLabel: t('common.unsaved.confirmDiscard'),
      tone: 'danger',
    }))
  ) {
    closeForm();
  }
}

async function handleCreate(): Promise<void> {
  if (!form.validate()) {
    return;
  }

  const result = await creating.execute({ name: draft.name, email: draft.email, title: draft.title || null, systemRoleId: draft.systemRoleId });

  if (result) {
    issued.value = { name: result.user?.name ?? draft.name, password: result.temporaryPassword };
    closeForm();
    await refresh();
  }
}

useSeoMeta({ title: () => t('layout.sectionNav.users') });
</script>
