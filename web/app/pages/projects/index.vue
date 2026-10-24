<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.home'), to: localePath('/') }, { label: t('project.list.title') }]">
    <NuxtLink
      v-if="canCreateProjects"
      :to="localePath('/admin/projects/new')"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-control bg-accent px-3.5 text-sm font-semibold text-accent-contrast hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <AppIcon name="plus" />
      {{ t('admin.projects.create') }}
    </NuxtLink>
  </AppTopbar>

  <div class="flex w-full flex-col gap-5 px-4 py-6 sm:px-6">
    <h1 class="flex items-center gap-3 text-2xl font-bold tracking-tight">
      <AppTileIcon name="projects" />
      {{ t('project.list.title') }}
    </h1>

    <AppPageSkeleton
      v-if="isPending && !projects"
      variant="cards"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />
    <AppEmptyState
      v-else-if="projects && !projects.length"
      :title="t('project.list.emptyTitle')"
      :description="t('project.list.emptyText')"
    />

    <template v-else-if="projects">
      <!-- One compact toolbar: search, status, role, order and how to show the list. -->
      <div
        role="search"
        :aria-label="t('project.list.filters')"
        class="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-card"
      >
        <label class="relative min-w-48 flex-1 sm:max-w-80">
          <span class="sr-only">{{ t('project.list.search') }}</span>
          <span class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-content-muted"
            ><AppIcon
              name="search"
              :size="16"
          /></span>
          <input
            v-model="query"
            type="search"
            maxlength="100"
            :placeholder="t('project.list.searchPlaceholder')"
            class="min-h-9 w-full rounded-control border border-line-strong bg-surface pr-2 pl-8 text-sm"
          />
        </label>
        <div
          role="group"
          :aria-label="t('project.list.status')"
          class="flex rounded-control border border-line-strong bg-surface p-0.5"
        >
          <button
            v-for="option in STATUSES"
            :key="option"
            type="button"
            :aria-pressed="status === option"
            :class="[
              'inline-flex min-h-8 items-center gap-1.5 rounded-[0.5rem] px-2.5 text-xs font-semibold',
              status === option ? 'bg-accent text-accent-contrast' : 'text-content-muted hover:text-content',
            ]"
            @click="status = option"
          >
            {{ t(`project.list.statuses.${option}`) }}
            <span class="tabular-nums opacity-80">{{ statusCounts[option] }}</span>
          </button>
        </div>
        <AppSelect
          v-model="roleFilter"
          size="sm"
          class="min-w-36"
          :aria-label="t('project.list.myRoleFilter')"
          :is-highlighted="roleFilter !== ''"
          :options="roleOptions"
        />
        <AppSelect
          v-model="sort"
          size="sm"
          class="min-w-40"
          :aria-label="t('project.list.sort')"
          :options="SORTS.map((option) => ({ value: option, label: t(`project.list.sorts.${option}`) }))"
        />
        <div
          role="group"
          :aria-label="t('project.list.view')"
          class="ml-auto flex rounded-control border border-line-strong bg-surface p-0.5"
        >
          <button
            v-for="option in VIEWS"
            :key="option.id"
            type="button"
            :aria-pressed="view === option.id"
            :aria-label="t(`project.list.views.${option.id}`)"
            :title="t(`project.list.views.${option.id}`)"
            :class="[
              'flex size-8 items-center justify-center rounded-[0.5rem]',
              view === option.id ? 'bg-accent text-accent-contrast' : 'text-content-muted hover:text-content',
            ]"
            @click="setView(option.id)"
          >
            <AppIcon
              :name="option.icon"
              :size="16"
            />
          </button>
        </div>
      </div>

      <p
        v-if="!shown.length"
        class="rounded-card border border-dashed border-line-strong bg-surface px-5 py-10 text-center text-sm text-content-muted"
      >
        {{ t('project.list.noMatch') }}
        <button
          type="button"
          class="ml-1 font-semibold text-accent-strong hover:underline"
          @click="clearFilters"
        >
          {{ t('project.list.clearFilters') }}
        </button>
      </p>

      <!-- Grid: the project cards. -->
      <ul
        v-else-if="view === 'grid'"
        class="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3"
      >
        <li
          v-for="project in shown"
          :key="project.code"
          :class="['flex min-w-0 flex-col rounded-card border border-line bg-surface shadow-card', project.archivedAt ? 'opacity-75' : '']"
        >
          <div class="flex flex-1 flex-col gap-3 p-5">
            <div class="flex items-start justify-between gap-3">
              <NuxtLink
                :to="localePath(`/p/${project.code}/plan`)"
                class="min-w-0 rounded-control hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span class="font-mono text-xs font-semibold text-content-muted">{{ project.code }}</span>
                <AppLocalizedText
                  :text="project.name"
                  as="h2"
                  class="text-lg font-semibold break-words"
                />
              </NuxtLink>
              <span class="flex shrink-0 flex-col items-end gap-1">
                <RoleBadge
                  v-if="project.myRole"
                  :role="project.myRole"
                />
                <AppBadge
                  v-if="project.archivedAt"
                  tone="warning"
                  >{{ t('project.archived.title') }}</AppBadge
                >
              </span>
            </div>
            <AppLocalizedText
              :text="project.description"
              as="p"
              class="text-sm leading-relaxed text-content-muted"
            />
            <dl class="mt-auto flex flex-col gap-2 border-t border-line pt-3 text-sm">
              <div class="flex items-center gap-2">
                <dt class="flex items-center gap-2 text-content-muted">
                  <AppIcon name="user" />
                  <span class="sr-only">{{ t('project.list.managers') }}</span>
                </dt>
                <dd class="min-w-0 break-words">{{ managerNames(project) }}</dd>
              </div>
              <div class="flex items-center gap-2">
                <dt class="flex items-center gap-2 text-content-muted">
                  <AppIcon name="users" />
                  <span class="sr-only">{{ t('project.list.membersLabel') }}</span>
                </dt>
                <dd>{{ t('project.list.memberCount', project.memberCount) }}</dd>
              </div>
              <div class="flex items-center gap-2">
                <dt class="flex items-center gap-2 text-content-muted">
                  <AppIcon name="image" />
                  <span class="sr-only">{{ t('project.list.designLabel') }}</span>
                </dt>
                <dd>{{ t('project.list.screenCount', project.screenCount) }} · {{ t('project.list.pointCount', project.pointCount) }}</dd>
              </div>
            </dl>
          </div>
          <nav
            :aria-label="t('project.list.openSection', { code: project.code })"
            class="grid grid-cols-3 gap-2 rounded-b-card border-t border-line bg-tile p-3"
          >
            <NuxtLink
              v-for="section in SECTIONS"
              :key="section.path"
              :to="localePath(`/p/${project.code}${section.path}`)"
              class="flex flex-col items-center gap-1.5 rounded-control px-1 py-2 text-xs font-semibold text-content hover:bg-surface hover:text-accent-strong hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <AppTileIcon
                :name="section.tile"
                size="sm"
              />
              {{ t(section.label) }}
            </NuxtLink>
          </nav>
        </li>
      </ul>

      <!-- List: one line per project. -->
      <section
        v-else
        class="overflow-x-auto rounded-card border border-line bg-surface shadow-card"
      >
        <table class="w-full min-w-[52rem] text-sm">
          <thead class="bg-surface-muted text-left text-xs font-semibold text-content-muted">
            <tr>
              <th
                scope="col"
                class="px-4 py-2.5"
              >
                {{ t('project.list.columns.project') }}
              </th>
              <th
                scope="col"
                class="px-3 py-2.5"
              >
                {{ t('project.list.columns.myRole') }}
              </th>
              <th
                scope="col"
                class="px-3 py-2.5"
              >
                {{ t('project.list.managers') }}
              </th>
              <th
                scope="col"
                class="px-3 py-2.5 text-right"
              >
                {{ t('project.list.membersLabel') }}
              </th>
              <th
                scope="col"
                class="px-3 py-2.5 text-right"
              >
                {{ t('project.list.designLabel') }}
              </th>
              <th
                scope="col"
                class="px-4 py-2.5"
              >
                <span class="sr-only">{{ t('project.list.shortcuts') }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr
              v-for="project in shown"
              :key="project.code"
              :class="['hover:bg-surface-muted', project.archivedAt ? 'opacity-70' : '']"
            >
              <td class="max-w-md px-4 py-2.5">
                <NuxtLink
                  :to="localePath(`/p/${project.code}/plan`)"
                  class="group flex flex-col focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span class="flex flex-wrap items-center gap-2">
                    <span class="font-mono text-xs font-semibold text-content-muted">{{ project.code }}</span>
                    <AppLocalizedText
                      :text="project.name"
                      class="font-semibold group-hover:text-accent-strong group-hover:underline"
                    />
                    <AppBadge
                      v-if="project.archivedAt"
                      tone="warning"
                      >{{ t('project.archived.title') }}</AppBadge
                    >
                  </span>
                  <AppLocalizedText
                    :text="project.description"
                    class="truncate text-xs text-content-muted"
                  />
                </NuxtLink>
              </td>
              <td class="px-3 py-2.5">
                <RoleBadge
                  v-if="project.myRole"
                  :role="project.myRole"
                />
              </td>
              <td class="px-3 py-2.5 text-content-muted">{{ managerNames(project) }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ project.memberCount }}</td>
              <td class="px-3 py-2.5 text-right tabular-nums">{{ project.screenCount }}</td>
              <td class="px-4 py-2.5">
                <nav
                  :aria-label="t('project.list.openSection', { code: project.code })"
                  class="flex justify-end gap-1"
                >
                  <NuxtLink
                    v-for="section in SECTIONS"
                    :key="section.path"
                    :to="localePath(`/p/${project.code}${section.path}`)"
                    :title="t(section.label)"
                    :aria-label="`${t(section.label)} · ${project.code}`"
                    class="flex size-8 items-center justify-center rounded-control text-content-muted hover:bg-tile hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <AppIcon
                      :name="section.icon"
                      :size="16"
                    />
                  </NuxtLink>
                </nav>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import AppTopbar from '@/components/layout/AppTopbar.vue';
import RoleBadge from '@/components/team/RoleBadge.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTileIcon, { type AppTileIconName } from '@/components/ui/AppTileIcon.vue';
import { localizedValues, resolveLocalizedText } from '@/utils/content-language';
import { matchesSearch } from '@/utils/search';
import type { ProjectListItem } from '~~/shared/contracts/project';

const SECTIONS: { path: string; label: string; icon: AppIconName; tile: AppTileIconName }[] = [
  { path: '/plan', label: 'project.nav.plan', icon: 'plan', tile: 'plan' },
  { path: '', label: 'project.nav.design', icon: 'design', tile: 'design' },
  { path: '/members', label: 'project.nav.members', icon: 'users', tile: 'members' },
];
const STATUSES = ['active', 'archived', 'all'] as const;
const SORTS = ['name', 'code', 'screens', 'members'] as const;
const VIEWS: { id: 'grid' | 'list'; icon: AppIconName }[] = [
  { id: 'grid', icon: 'grid' },
  { id: 'list', icon: 'plan' },
];
const VIEW_STORAGE_KEY = 'origo-projects-view';

const { t } = useI18n();
const localePath = useLocalePath();
const { contentLanguage } = useContentLanguage();
const { canCreateProjects } = useSystemAccess();
const { nameOf: roleName } = useProjectRoles();
const { data: projects, isPending, hasFailed, errorMessage, refresh } = await useProjectList();

const query = ref('');
const status = ref<(typeof STATUSES)[number]>('active');
const roleFilter = ref<string | number | null>('');
const sort = ref<string | number | null>('name');
const view = ref<'grid' | 'list'>('grid');

// The chosen view is a personal preference, kept in this browser only.
onMounted(() => {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);

    if (saved === 'grid' || saved === 'list') {
      view.value = saved;
    }
  } catch {
    // Storage may be blocked; the grid is fine.
  }
});

function setView(next: 'grid' | 'list'): void {
  view.value = next;

  try {
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  } catch {
    // Not remembered, still shown.
  }
}

function nameOf(project: ProjectListItem): string {
  return resolveLocalizedText(project.name, contentLanguage.value.primary).value;
}

function managerNames(project: ProjectListItem): string {
  return project.managers.map((manager) => manager.name).join(', ') || t('project.list.noManager');
}

const statusCounts = computed(() => {
  const list = projects.value ?? [];
  const archived = list.filter((project) => project.archivedAt).length;

  return { active: list.length - archived, archived, all: list.length };
});

const roleOptions = computed(() => {
  const keys = [...new Set((projects.value ?? []).map((project) => project.myRole).filter((role): role is string => Boolean(role)))];

  return [{ value: '', label: t('project.list.anyRole') }, ...keys.map((key) => ({ value: key, label: roleName(key) }))];
});

const shown = computed(() => {
  const list = (projects.value ?? []).filter(
    (project) =>
      (status.value === 'all' || (status.value === 'archived') === Boolean(project.archivedAt)) &&
      (!roleFilter.value || project.myRole === roleFilter.value) &&
      matchesSearch([project.code, ...localizedValues(project.name), ...localizedValues(project.description), managerNames(project)], query.value),
  );
  const compare: Record<string, (left: ProjectListItem, right: ProjectListItem) => number> = {
    name: (left, right) => nameOf(left).localeCompare(nameOf(right)),
    code: (left, right) => left.code.localeCompare(right.code),
    screens: (left, right) => right.screenCount - left.screenCount,
    members: (left, right) => right.memberCount - left.memberCount,
  };

  return [...list].sort(compare[String(sort.value)] ?? compare.name);
});

function clearFilters(): void {
  query.value = '';
  roleFilter.value = '';
  status.value = 'all';
}

useSeoMeta({ title: () => t('project.list.title') });
</script>
