<template>
  <AppTopbar
    :crumbs="[
      { label: t('project.list.title'), to: localePath('/projects') },
      { label: projectName, to: localePath(`/p/${code}`) },
      { label: t('team.title') },
    ]"
  >
    <AppButton
      v-if="canManage"
      @click="isAddOpen = true"
    >
      <span class="inline-flex items-center gap-1.5"><AppIcon name="plus" />{{ t('team.add.title') }}</span>
    </AppButton>
  </AppTopbar>
  <ProjectNav
    :project-code="code"
    current="members"
  />

  <div class="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
    <div class="flex max-w-3xl flex-col gap-2">
      <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <AppTileIcon name="members" />
        {{ t('team.title') }}
      </h1>
      <p class="text-content-muted">{{ t('team.description') }}</p>
    </div>

    <AppPageSkeleton
      v-if="isPending && !members"
      variant="list"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <div
      v-else-if="members"
      class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div class="flex min-w-0 flex-col gap-4">
        <!-- At a glance: how big the team is and who can change things. -->
        <dl class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div
            v-for="stat in stats"
            :key="stat.id"
            :class="['flex flex-col gap-1 rounded-card border bg-surface px-4 py-3 shadow-card', stat.isWarning ? 'border-warning/50' : 'border-line']"
          >
            <dt class="flex items-center gap-1.5 text-xs font-semibold text-content-muted">
              <AppIcon
                :name="stat.icon"
                :size="14"
              />
              {{ stat.label }}
            </dt>
            <dd :class="['text-2xl font-bold tabular-nums', stat.isWarning ? 'text-warning' : '']">{{ stat.value }}</dd>
          </div>
        </dl>

        <p
          v-if="actionError"
          role="alert"
          class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {{ actionError }}
        </p>

        <section class="flex flex-col rounded-card border border-line bg-surface shadow-card">
          <div class="flex flex-col gap-3 border-b border-line px-5 py-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-semibold">
                {{ t('team.list') }} <span class="text-sm font-normal text-content-muted">({{ filtered.length }}/{{ members.length }})</span>
              </h2>
              <label class="relative w-full sm:w-72">
                <span class="sr-only">{{ t('team.search') }}</span>
                <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-content-muted"><AppIcon name="search" /></span>
                <input
                  v-model="query"
                  type="search"
                  maxlength="100"
                  :placeholder="t('team.searchPlaceholder')"
                  class="min-h-10 w-full rounded-control border border-line-strong bg-surface pr-3 pl-10 text-sm"
                />
              </label>
            </div>
            <div
              role="group"
              :aria-label="t('team.filterByRole')"
              class="flex flex-wrap gap-1.5"
            >
              <button
                v-for="chip in roleChips"
                :key="chip.key ?? 'all'"
                type="button"
                :aria-pressed="roleFilter === chip.key"
                :class="[
                  'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  roleFilter === chip.key
                    ? 'border-accent bg-accent text-accent-contrast'
                    : 'border-line-strong bg-surface text-content-muted hover:border-accent hover:text-content',
                ]"
                @click="roleFilter = chip.key"
              >
                {{ chip.label }}
                <span class="tabular-nums opacity-80">{{ chip.count }}</span>
              </button>
            </div>
          </div>

          <AppEmptyState
            v-if="!members.length"
            :title="t('team.empty.title')"
            :description="t(canManage ? 'team.empty.textManager' : 'team.empty.text')"
          />
          <p
            v-else-if="!filtered.length"
            class="px-5 py-10 text-center text-sm text-content-muted"
          >
            {{ t('team.noMatch') }}
            <button
              type="button"
              class="ml-1 font-semibold text-accent-strong hover:underline"
              @click="clearFilters"
            >
              {{ t('team.clearFilters') }}
            </button>
          </p>
          <ul
            v-else
            class="divide-y divide-line"
          >
            <li
              v-for="member in filtered"
              :key="member.id"
              :class="['grid grid-cols-1 items-center gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_11rem_auto]', member.user.isActive ? '' : 'bg-surface-muted']"
            >
              <div class="flex min-w-0 items-center gap-3">
                <AppAvatar :initials="member.user.initials" />
                <div class="flex min-w-0 flex-col leading-tight">
                  <span class="flex flex-wrap items-center gap-1.5 font-semibold break-words">
                    {{ member.user.name }}
                    <AppBadge
                      v-if="member.user.email === currentUser?.email"
                      tone="accent"
                      >{{ t('team.you') }}</AppBadge
                    >
                    <AppBadge
                      v-if="!member.user.isActive"
                      tone="danger"
                      >{{ t('team.locked') }}</AppBadge
                    >
                  </span>
                  <span class="text-sm break-all text-content-muted">
                    <template v-if="member.user.title">{{ member.user.title }} · </template>{{ member.user.email }}
                  </span>
                </div>
              </div>

              <NuxtLink
                :to="localePath(`/p/${code}/plan`)"
                class="flex flex-col gap-1 rounded-control px-2 py-1 text-xs hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent"
                :title="t('team.workTitle')"
              >
                <template v-if="workOf(member).total">
                  <span class="font-semibold">{{ t('team.work', workOf(member).total) }}</span>
                  <span class="flex items-center gap-2">
                    <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-mark">
                      <span
                        class="block h-full bg-success-mark"
                        :style="{ width: `${(workOf(member).done / workOf(member).total) * 100}%` }"
                      />
                    </span>
                    <span class="text-content-muted tabular-nums">{{ workOf(member).done }}/{{ workOf(member).total }}</span>
                  </span>
                </template>
                <span
                  v-else
                  class="text-content-muted"
                  >{{ t('team.noWork') }}</span
                >
              </NuxtLink>

              <div class="flex items-center gap-2">
                <template v-if="canManage">
                  <label
                    class="sr-only"
                    :for="`role-${member.id}`"
                    >{{ t('team.roleOf', { name: member.user.name }) }}</label
                  >
                  <AppSelect
                    :id="`role-${member.id}`"
                    :model-value="member.role"
                    size="sm"
                    class="w-full md:w-52"
                    :is-disabled="changing.isPending.value"
                    :options="roleOptions"
                    @update:model-value="handleRoleChange(member, String($event))"
                  />
                </template>
                <RoleBadge
                  v-else
                  :role="member.role"
                />
                <AppButton
                  v-if="canManage"
                  variant="danger"
                  :aria-label="t('team.removeNamed', { name: member.user.name })"
                  :title="t('team.remove')"
                  @click="handleRemove(member)"
                >
                  <AppIcon
                    name="trash"
                    :size="16"
                  />
                </AppButton>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <aside class="flex flex-col gap-4 xl:sticky xl:top-4">
        <TeamRoleSummary
          :roles="projectRoles"
          :permissions="projectPermissions ?? []"
          :counts="roleCounts"
          :active-role="roleFilter"
          :can-edit-roles="canManageSettings"
          @filter="roleFilter = $event"
        />
      </aside>
    </div>

    <TeamAddDialog
      v-if="canManage"
      v-model:open="isAddOpen"
      :roles="projectRoles"
      :search="lookupUsers"
      :exclude-ids="memberUserIds"
      :is-saving="adding.isPending.value"
      :error="adding.errorMessage.value"
      @add="handleAdd"
    />
  </div>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import ProjectNav from '@/components/project/ProjectNav.vue';
import RoleBadge from '@/components/team/RoleBadge.vue';
import TeamAddDialog from '@/components/team/TeamAddDialog.vue';
import TeamRoleSummary from '@/components/team/TeamRoleSummary.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue';
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import { fetchPermissions } from '@/api/settings/settings';
import { addProjectMember, changeProjectMemberRole, lookupUsers, removeProjectMember } from '@/api/team/team';
import { resolveLocalizedText } from '@/utils/content-language';
import type { ProjectPermission } from '~~/shared/contracts/access';
import type { ProjectMember } from '~~/shared/contracts/member';

const { t } = useI18n();
const localePath = useLocalePath();
const { code } = useProjectRoute();
const { contentLanguage } = useContentLanguage();
const currentUser = useCurrentUser();
const { canManageSettings } = useSystemAccess();
const { data: projectScreens } = await useProjectScreens(code);
const { data: members, isPending, hasFailed, errorMessage, refresh } = await useProjectMembers(code);
const { data: plan, refresh: refreshPlan } = await useProjectPlan(code);
// The permissions admins named in Settings, so the role guide always matches what applies.
const { data: projectPermissions } = await useRouteResource('permissions-project', () => fetchPermissions('project'));
const { roles: projectRoles, find: findRole, nameOf } = useProjectRoles();
const confirm = useConfirm();

const projectName = computed(() =>
  projectScreens.value ? resolveLocalizedText(projectScreens.value.project.name, contentLanguage.value.primary).value : code.value,
);
const canManage = computed(() => Boolean(projectScreens.value?.project.permissions.canManageMembers));
const memberUserIds = computed(() => members.value?.map((member) => member.user.id) ?? []);

const query = ref('');
const roleFilter = ref<string | null>(null);
const isAddOpen = ref(false);

function roleAllows(member: ProjectMember, ...permissions: ProjectPermission[]): boolean {
  const granted = findRole(member.role)?.permissions ?? [];

  return permissions.some((permission) => granted.includes(permission));
}

const roleCounts = computed(() => {
  const counts: Record<string, number> = {};

  for (const member of members.value ?? []) {
    counts[member.role] = (counts[member.role] ?? 0) + 1;
  }

  return counts;
});

const roleChips = computed(() => [
  { key: null, label: t('team.allRoles'), count: members.value?.length ?? 0 },
  ...projectRoles.value
    .filter((role) => roleCounts.value[role.key])
    .map((role) => ({ key: role.key, label: nameOf(role.key), count: roleCounts.value[role.key] ?? 0 })),
]);

const stats = computed<{ id: string; label: string; value: number; icon: AppIconName; isWarning?: boolean }[]>(() => {
  const list = members.value ?? [];
  const locked = list.filter((member) => !member.user.isActive).length;

  return [
    { id: 'total', label: t('team.stats.total'), value: list.length, icon: 'users' },
    { id: 'editors', label: t('team.stats.editors'), value: list.filter((member) => roleAllows(member, 'plan.edit', 'design.edit')).length, icon: 'pencil' },
    { id: 'managers', label: t('team.stats.managers'), value: list.filter((member) => roleAllows(member, 'members.manage')).length, icon: 'shield' },
    { id: 'locked', label: t('team.stats.locked'), value: locked, icon: 'lock', isWarning: locked > 0 },
  ];
});

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase();

  return (members.value ?? []).filter(
    (member) =>
      (!roleFilter.value || member.role === roleFilter.value) &&
      (!needle || [member.user.name, member.user.email, member.user.title ?? ''].some((value) => value.toLowerCase().includes(needle))),
  );
});

// Schedule entries each person owns in the plan, and how many of them are done.
const workByUser = computed(() => {
  const work = new Map<number, { total: number; done: number }>();

  for (const task of plan.value?.tasks ?? []) {
    if (task.assigneeId !== null) {
      const entry = work.get(task.assigneeId) ?? { total: 0, done: 0 };

      entry.total += 1;
      entry.done += task.status === 'done' ? 1 : 0;
      work.set(task.assigneeId, entry);
    }
  }

  return work;
});

function workOf(member: ProjectMember): { total: number; done: number } {
  return workByUser.value.get(member.user.id) ?? { total: 0, done: 0 };
}

function clearFilters(): void {
  query.value = '';
  roleFilter.value = null;
}

const roleOptions = computed(() => projectRoles.value.map((role) => ({ value: role.key, label: nameOf(role.key) })));

const adding = useAppRequest(addProjectMember);
const changing = useAppRequest(changeProjectMemberRole);
const removing = useAppRequest(removeProjectMember);

const actionError = computed(() => changing.errorMessage.value || removing.errorMessage.value);

async function handleAdd(userId: number, role: string): Promise<void> {
  if (await adding.execute(code.value, userId, role)) {
    isAddOpen.value = false;
    await refresh();
  }
}

// A refused change (e.g. the last person who can manage members) leaves the box on the role that still
// applies, since it always shows the saved role.
async function handleRoleChange(member: ProjectMember, role: string): Promise<void> {
  if (await changing.execute(code.value, member.id, role)) {
    await refresh();
  }
}

// Removing someone who still owns schedule entries says so; the entries stay, only nobody owns them afterwards.
async function handleRemove(member: ProjectMember): Promise<void> {
  const ownedTasks = workOf(member).total;
  const isConfirmed = await confirm(t('team.removeConfirm', { name: member.user.name }), {
    description: ownedTasks ? t('team.removeImpact', ownedTasks) : t('team.removeNoImpact'),
    confirmLabel: t('team.remove'),
    tone: 'danger',
  });

  if (isConfirmed && (await removing.execute(code.value, member.id))) {
    await Promise.all([refresh(), refreshPlan()]);
  }
}

useSeoMeta({ title: () => `${t('team.title')} · ${projectName.value}` });
</script>
