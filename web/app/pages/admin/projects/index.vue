<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.projects'), to: localePath('/projects') }, { label: t('layout.sectionNav.allProjects') }]">
    <NuxtLink
      v-if="canCreateProjects"
      :to="localePath('/admin/projects/new')"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-control bg-accent px-3.5 text-sm font-semibold text-accent-contrast hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <AppIcon name="plus" />
      {{ t('admin.projects.create') }}
    </NuxtLink>
  </AppTopbar>

  <div class="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
    <div class="flex max-w-3xl flex-col gap-2">
      <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <AppTileIcon name="projects" />
        {{ t('admin.projects.title') }}
      </h1>
      <p class="text-content-muted">{{ t('admin.projects.listDescription') }}</p>
    </div>

    <AppPageSkeleton
      v-if="isPending && !projects"
      variant="table"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <section
      v-else-if="projects"
      class="flex flex-col rounded-card border border-line bg-surface shadow-card"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 class="text-lg font-semibold">
          {{ t('admin.projects.all') }} <span class="text-sm font-normal text-content-muted">({{ projects.length }})</span>
        </h2>
        <label class="relative w-full sm:w-80">
          <span class="sr-only">{{ t('admin.users.search') }}</span>
          <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-content-muted"><AppIcon name="search" /></span>
          <input
            v-model="query"
            type="search"
            maxlength="100"
            :placeholder="t('admin.projects.searchPlaceholder')"
            class="min-h-10 w-full rounded-control border border-line-strong bg-surface pr-3 pl-10 text-sm"
          />
        </label>
      </div>
      <p
        v-if="!filtered.length"
        class="px-6 py-10 text-center text-sm text-content-muted"
      >
        {{ t(projects.length ? 'admin.projects.noMatch' : 'admin.projects.empty') }}
      </p>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full min-w-[48rem] text-sm">
          <thead class="bg-surface-muted text-left text-xs font-semibold text-content-muted">
            <tr>
              <th
                scope="col"
                class="px-6 py-3"
              >
                {{ t('admin.projects.columns.project') }}
              </th>
              <th
                scope="col"
                class="px-3 py-3"
              >
                {{ t('admin.projects.manager') }}
              </th>
              <th
                scope="col"
                class="px-3 py-3 text-right"
              >
                {{ t('admin.projects.columns.members') }}
              </th>
              <th
                scope="col"
                class="px-3 py-3 text-right"
              >
                {{ t('admin.projects.columns.screens') }}
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
              v-for="project in filtered"
              :key="project.code"
              class="hover:bg-surface-muted"
            >
              <td class="px-6 py-3">
                <span class="flex items-center gap-2">
                  <span class="font-mono text-xs font-semibold text-content-muted">{{ project.code }}</span>
                  <AppBadge
                    v-if="project.archivedAt"
                    tone="warning"
                    >{{ t('project.archived.title') }}</AppBadge
                  >
                </span>
                <AppLocalizedText
                  :text="project.name"
                  as="p"
                  class="font-semibold"
                />
              </td>
              <td class="px-3 py-3">
                <span
                  v-if="project.managers.length"
                  class="flex flex-wrap items-center gap-2"
                >
                  <span
                    v-for="manager in project.managers"
                    :key="manager.id"
                    class="inline-flex items-center gap-1.5"
                  >
                    <AppAvatar
                      :initials="manager.initials"
                      size="sm"
                    />
                    {{ manager.name }}
                  </span>
                </span>
                <AppBadge
                  v-else
                  tone="warning"
                  >{{ t('project.list.noManager') }}</AppBadge
                >
              </td>
              <td class="px-3 py-3 text-right tabular-nums">{{ project.memberCount }}</td>
              <td class="px-3 py-3 text-right tabular-nums">{{ project.screenCount }}</td>
              <td class="px-6 py-3">
                <div class="flex flex-wrap justify-end gap-2">
                  <NuxtLink
                    :to="localePath(`/p/${project.code}/members`)"
                    class="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <AppIcon
                      name="users"
                      :size="16"
                    />
                    {{ t('admin.projects.assignMembers') }}
                  </NuxtLink>
                  <NuxtLink
                    :to="localePath(`/p/${project.code}/plan`)"
                    class="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {{ t('admin.projects.open') }}
                    <AppIcon
                      name="arrowRight"
                      :size="16"
                    />
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import { localizedValues } from '@/utils/content-language';

const { t } = useI18n();
const localePath = useLocalePath();
const { canSeeAllProjects, canCreateProjects } = useSystemAccess();

if (!canSeeAllProjects.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const { data: projects, isPending, hasFailed, errorMessage, refresh } = await useProjectList();
const query = ref('');

// Admins see every project, so a code or name search is enough at this size.
const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase();

  return (projects.value ?? []).filter(
    (project) => !needle || [project.code, ...localizedValues(project.name)].some((value) => value.toLowerCase().includes(needle)),
  );
});

useSeoMeta({ title: () => t('admin.projects.title') });
</script>
