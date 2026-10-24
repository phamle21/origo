<template>
  <AppTopbar
    :crumbs="[
      { label: t('project.list.title'), to: localePath('/projects') },
      { label: projectName, to: localePath(`/p/${code}`) },
    ]"
  >
    <template #trail>
      <ScreenSwitcher
        v-if="projectScreens?.screens.length"
        :screens="projectScreens.screens"
        :current-code="screenCode"
        :label="t('screen.detail.switcherLabel')"
        @change="handleScreenChange"
      />
      <span
        v-else
        class="font-medium text-content"
        aria-current="page"
        >{{ screenName }}</span
      >
    </template>
    <NuxtLink
      v-if="projectScreens?.project.permissions.canEditDesign && screen"
      :to="localePath(`/p/${code}/${screen.code}/edit`)"
      class="inline-flex min-h-9 items-center rounded-control bg-accent px-3.5 text-sm font-semibold text-accent-contrast hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >✎ {{ t('editor.edit') }}</NuxtLink
    >
    <button
      v-if="projectScreens?.project.permissions.canEditDesign && screen"
      type="button"
      class="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-danger/40 bg-danger-soft px-3 text-sm font-semibold text-danger hover:bg-danger hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
      @click="handleDelete"
    >
      <AppIcon
        name="trash"
        :size="16"
      />
      {{ t('screen.list.delete') }}
    </button>
  </AppTopbar>

  <div class="w-full px-4 py-6 sm:px-6">
    <AppPageSkeleton
      v-if="isPending && !screen"
      variant="screen"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <div
      v-else-if="screen"
      class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <div class="flex min-w-0 flex-col gap-4">
        <header class="flex flex-col gap-1">
          <AppLocalizedText
            :text="screen.name"
            as="h1"
            class="text-2xl font-bold tracking-tight"
          />
          <AppLocalizedText
            :text="screen.purpose"
            as="p"
            class="text-content-muted"
          />
          <p
            v-if="screen.features.length"
            class="flex flex-wrap items-center gap-1.5 pt-1 text-sm"
          >
            <span class="text-content-muted">{{ t('screen.detail.features') }}</span>
            <NuxtLink
              v-for="feature in screen.features"
              :key="feature.id"
              :to="localePath(`/p/${code}/plan`)"
              class="rounded-control bg-accent-soft px-2 py-0.5 font-medium text-accent-strong hover:underline"
            >
              <AppLocalizedText :text="feature.name" />
            </NuxtLink>
          </p>
        </header>

        <ScreenMapViewer
          :image="screen.image"
          :image-alt="t('screen.detail.imageAlt', { name: screenName })"
          :points="screen.points"
          :selected-number="selectedNumber"
          :caption="t('screen.detail.howTo')"
          @select="handlePointSelect"
        />

        <ScreenPointList
          :points="screen.points"
          :selected-number="selectedNumber"
          :label="t('screen.detail.pointsLabel')"
          @select="handlePointSelect"
        />
      </div>

      <div class="min-w-0 lg:sticky lg:top-20">
        <ScreenPointPanel
          v-if="selectedPoint"
          :point="selectedPoint"
          :active-tab="activeTab"
          :project-path="localePath(`/p/${code}`)"
          :is-comment-pending="comment.isPending.value"
          :comment-error="comment.errorMessage.value"
          :comment-saved-count="commentSavedCount"
          @update:active-tab="handleTabChange"
          :people="people"
          @submit-comment="handleCommentSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import ScreenMapViewer from '@/components/screen/ScreenMapViewer.vue';
import ScreenPointList from '@/components/screen/ScreenPointList.vue';
import ScreenPointPanel from '@/components/screen/ScreenPointPanel.vue';
import ScreenSwitcher from '@/components/screen/ScreenSwitcher.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { isPointTab, type PointTab } from '@/utils/point-tabs';
import { deleteScreen, postPointComment } from '@/api/screen/screen';
import AppIcon from '@/components/ui/AppIcon.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const { code } = useProjectRoute();
const { contentLanguage } = useContentLanguage();
const screenCode = computed(() => String(route.params.screen ?? '').toUpperCase());
const { data: projectScreens } = await useProjectScreens(code);
const { data: screen, isPending, hasFailed, errorMessage, refresh } = await useScreenDetail(code, screenCode);
// Everyone in the project can be tagged with @ in a comment.
const { data: members } = await useProjectMembers(code);
const people = computed(() => (members.value ?? []).filter((member) => member.user.isActive).map((member) => member.user));

const projectName = computed(() =>
  projectScreens.value ? resolveLocalizedText(projectScreens.value.project.name, contentLanguage.value.primary).value : code.value,
);
const screenName = computed(() => (screen.value ? resolveLocalizedText(screen.value.name, contentLanguage.value.primary).value : screenCode.value));

// `?point=` and `?tab=` make a link open a screen on a specific number and tab, e.g. a QA link straight to
// the tests of point 2. Unknown values fall back to the first point and the basic design tab.
const selectedNumber = computed(() => {
  const requested = Number(route.query.point);
  const points = screen.value?.points ?? [];

  return points.some((point) => point.number === requested) ? requested : (points[0]?.number ?? null);
});
const selectedPoint = computed(() => screen.value?.points.find((point) => point.number === selectedNumber.value) ?? null);
const activeTab = computed<PointTab>(() => (isPointTab(route.query.tab) ? route.query.tab : 'basic'));

const comment = useAppRequest(postPointComment);
const commentSavedCount = ref(0);

async function handleCommentSubmit(text: string, mentionIds: number[]): Promise<void> {
  const created = await comment.execute(code.value, selectedPoint.value?.id ?? '', text, mentionIds);

  if (created) {
    commentSavedCount.value += 1;
    await refresh();
  }
}

async function handlePointSelect(number: number): Promise<void> {
  await router.replace({ query: { ...route.query, point: String(number) } });
}

async function handleTabChange(tab: PointTab): Promise<void> {
  await router.replace({ query: { ...route.query, tab } });
}

// Another screen starts on its first point; the open tab is kept so a QA reviewer stays on the tests.
async function handleScreenChange(nextCode: string): Promise<void> {
  await navigateTo({ path: localePath(`/p/${code.value}/${nextCode}`), query: route.query.tab ? { tab: route.query.tab } : {} });
}

const deleting = useAppRequest(deleteScreen);
const confirm = useConfirm();

// Says what goes with the screen: its points (with their comments) and its links to plan features.
async function handleDelete(): Promise<void> {
  if (!screen.value) {
    return;
  }

  const parts = [
    screen.value.points.length ? t('editor.status.deleteImpact.points', screen.value.points.length) : '',
    screen.value.features.length ? t('editor.status.deleteImpact.features', screen.value.features.length) : '',
  ].filter(Boolean);
  const isConfirmed = await confirm(t('screen.list.deleteConfirm', { code: screen.value.code, name: screenName.value }), {
    description: parts.length ? t('editor.status.deleteImpact.summary', { parts: parts.join(', ') }) : t('screen.list.deleteImpact', 0),
    confirmLabel: t('screen.list.delete'),
    tone: 'danger',
  });

  if (isConfirmed && (await deleting.execute(code.value, screen.value.code))) {
    clearNuxtData([`screen-detail:${code.value}:${screenCode.value}`, `project-screens:${code.value}`, `editor-context:${code.value}`]);
    await navigateTo(localePath(`/p/${code.value}`));
  }
}

useSeoMeta({ title: () => screenName.value });
</script>
