<template>
  <AppTopbar :crumbs="[{ label: t('project.list.title'), to: localePath('/projects') }, { label: projectName }]" />
  <ProjectNav
    :project-code="code"
    current="design"
  />

  <div class="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex max-w-2xl min-w-0 flex-col gap-2">
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <AppTileIcon name="design" />
          {{ t('screen.list.title') }}
        </h1>
        <p class="text-content-muted">{{ t('screen.list.howTo') }}</p>
      </div>
      <div class="flex w-full flex-wrap items-end gap-3 sm:w-auto">
        <NuxtLink
          v-if="data?.project.permissions.canEditDesign"
          :to="localePath(`/p/${code}/new`)"
          class="inline-flex min-h-10 items-center rounded-control bg-accent px-4 text-sm font-semibold text-accent-contrast hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >+ {{ t('editor.addScreen') }}</NuxtLink
        >
        <label
          v-if="screens.length"
          class="flex w-full flex-col gap-1 text-xs font-semibold text-content-muted sm:w-72"
        >
          {{ t('screen.list.search') }}
          <input
            v-model="query"
            type="search"
            maxlength="100"
            :placeholder="t('screen.list.searchPlaceholder')"
            class="min-h-10 rounded-control border border-line-strong bg-surface px-3 text-sm font-normal text-content focus:border-accent focus:outline-none"
          />
        </label>
      </div>
    </div>

    <AppPageSkeleton
      v-if="isPending && !data"
      variant="cards"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <p
      v-if="deleting.hasFailed.value"
      role="alert"
      class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ deleting.errorMessage.value }}
    </p>

    <AppEmptyState
      v-else-if="data && !screens.length"
      :title="t('screen.list.emptyTitle')"
      :description="t('screen.list.emptyText')"
    />

    <p
      v-else-if="data && !groups.length"
      class="text-sm text-content-muted"
    >
      {{ t('screen.list.noMatch', { query: query.trim() }) }}
    </p>

    <section
      v-for="group in groups"
      :key="group.key"
      class="flex flex-col gap-3"
    >
      <AppLocalizedText
        :text="group.flow"
        as="h2"
        class="text-sm font-semibold tracking-wider text-content-muted uppercase"
      />
      <ol class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="screen in group.screens"
          :key="screen.code"
          class="relative min-w-0"
        >
          <NuxtLink
            :to="localePath(`/p/${code}/${screen.code}`)"
            class="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface text-content shadow-card hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <img
              :src="screen.image.src"
              alt=""
              :width="screen.image.width"
              :height="screen.image.height"
              loading="lazy"
              class="block h-auto w-full border-b border-line"
            />
            <span class="flex flex-col gap-1 p-4">
              <AppLocalizedText
                :text="screen.name"
                class="font-semibold"
              />
              <span class="text-sm text-content-muted">{{ t('screen.list.pointCount', screen.pointCount) }}</span>
            </span>
          </NuxtLink>
          <button
            v-if="data?.project.permissions.canEditDesign"
            type="button"
            class="absolute top-2 right-2 flex size-9 items-center justify-center rounded-control border border-danger/40 bg-danger-soft text-danger shadow-card hover:bg-danger hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
            :aria-label="t('screen.list.deleteNamed', { code: screen.code, name: nameOf(screen) })"
            :title="t('screen.list.delete')"
            @click="handleDelete(screen)"
          >
            <AppIcon
              name="trash"
              :size="16"
            />
          </button>
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import ProjectNav from '@/components/project/ProjectNav.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import { deleteScreen } from '@/api/screen/screen';
import { localizedValues, resolveLocalizedText } from '@/utils/content-language';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { ScreenSummary } from '~~/shared/contracts/screen';

const { t } = useI18n();
const localePath = useLocalePath();
const { code } = useProjectRoute();
const { contentLanguage } = useContentLanguage();
const { data, isPending, hasFailed, errorMessage, refresh } = await useProjectScreens(code);

const query = ref<string>('');
const deleting = useAppRequest(deleteScreen);
const confirm = useConfirm();

function nameOf(screen: ScreenSummary): string {
  return resolveLocalizedText(screen.name, contentLanguage.value.primary).value;
}

// Deleting a screen takes its numbered points and their comments with it, and unlinks it from the plan.
async function handleDelete(screen: ScreenSummary): Promise<void> {
  const isConfirmed = await confirm(t('screen.list.deleteConfirm', { code: screen.code, name: nameOf(screen) }), {
    description: t('screen.list.deleteImpact', screen.pointCount),
    confirmLabel: t('screen.list.delete'),
    tone: 'danger',
  });

  if (isConfirmed && (await deleting.execute(code.value, screen.code))) {
    clearNuxtData([`screen-detail:${code.value}:${screen.code}`, `editor-context:${code.value}`]);
    await refresh();
  }
}

const screens = computed(() => data.value?.screens ?? []);
const projectName = computed(() => (data.value ? resolveLocalizedText(data.value.project.name, contentLanguage.value.primary).value : code.value));

// Search matches the screen name in both content languages, so a Japanese reader finds a screen whose
// Japanese name is not written yet.
const groups = computed(() => {
  const needle = query.value.trim().toLowerCase();
  const byFlow = new Map<string, { flow: LocalizedText; screens: ScreenSummary[] }>();

  for (const screen of screens.value) {
    const names = localizedValues(screen.name);

    if (needle && !names.some((name) => name.toLowerCase().includes(needle))) {
      continue;
    }

    const key = screen.flow.vi ?? localizedValues(screen.flow)[0] ?? '';
    const group = byFlow.get(key) ?? { flow: screen.flow, screens: [] };

    group.screens.push(screen);
    byFlow.set(key, group);
  }

  return [...byFlow.entries()].map(([key, group]) => ({ key, ...group }));
});

useSeoMeta({ title: () => projectName.value });
</script>
