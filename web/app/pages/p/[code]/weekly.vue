<template>
  <AppTopbar
    :crumbs="[
      { label: t('project.list.title'), to: localePath('/projects') },
      { label: projectName, to: localePath(`/p/${code}`) },
      { label: t('weekly.title') },
    ]"
  />
  <ProjectNav
    :project-code="code"
    current="weekly"
  />

  <div class="flex w-full flex-col gap-5 px-4 py-6 sm:px-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex max-w-3xl min-w-0 flex-col gap-2">
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <AppTileIcon name="plan" />
          {{ t('weekly.title') }}
        </h1>
        <p class="text-content-muted">{{ t('weekly.description') }}</p>
      </div>
      <a
        v-if="report?.weeks.length"
        :href="planExportUrl(code, contentLanguage.primary)"
        download
        class="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <AppIcon
          name="download"
          :size="16"
        />{{ t('plan.export.label') }}
      </a>
    </div>

    <AppPageSkeleton
      v-if="isPending && !report"
      variant="plan"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <template v-else-if="report">
      <!-- 1. Progress frozen week by week. -->
      <section class="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-bold">{{ t('weekly.progress.title') }}</h2>
          <AppButton
            v-if="report.canEdit"
            variant="secondary"
            :is-disabled="recording.isPending.value"
            @click="handleRecord"
          >
            <span class="inline-flex items-center gap-1.5"
              ><AppIcon
                name="check"
                :size="16"
              />{{ t(currentWeek?.snapshot ? 'weekly.progress.rerecord' : 'weekly.progress.record') }}</span
            >
          </AppButton>
        </div>
        <p class="text-sm text-content-muted">{{ t('weekly.progress.hint') }}</p>
        <p
          v-if="recording.hasFailed.value"
          role="alert"
          class="text-sm text-danger"
        >
          {{ recording.errorMessage.value }}
        </p>

        <div class="overflow-x-auto">
          <table class="w-full min-w-max text-sm">
            <caption class="sr-only">
              {{
                t('weekly.progress.title')
              }}
            </caption>
            <thead class="bg-toolbar text-xs text-content-muted">
              <tr>
                <th
                  scope="col"
                  class="sticky left-0 bg-toolbar px-3 py-2 text-left font-semibold"
                >
                  {{ t('weekly.week') }}
                </th>
                <th
                  scope="col"
                  class="px-3 py-2 text-left font-semibold"
                >
                  {{ t('weekly.progress.overall') }}
                </th>
                <th
                  scope="col"
                  class="px-3 py-2 text-right font-semibold"
                >
                  {{ t('weekly.progress.delta') }}
                </th>
                <th
                  scope="col"
                  class="px-3 py-2 text-right font-semibold"
                >
                  {{ t('weekly.progress.timeElapsed') }}
                </th>
                <th
                  v-for="stage in stageColumns"
                  :key="stage.stageId"
                  scope="col"
                  class="px-3 py-2 text-right font-semibold"
                >
                  {{ resolveLocalizedText(stage.name, contentLanguage.primary).value }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in progressRows"
                :key="row.week.weekStart"
                :class="['border-t border-line', row.week.weekStart === selectedWeek ? 'bg-accent-soft/50' : '']"
              >
                <th
                  scope="row"
                  class="sticky left-0 bg-inherit px-3 py-2 text-left font-normal"
                >
                  <button
                    type="button"
                    class="text-left font-semibold whitespace-nowrap hover:underline focus-visible:outline-2 focus-visible:outline-accent"
                    :aria-pressed="row.week.weekStart === selectedWeek"
                    @click="selectedWeek = row.week.weekStart"
                  >
                    {{ weekLabel(row.week.weekStart) }}
                  </button>
                  <span
                    v-if="row.week.weekStart === report.currentWeek"
                    class="ml-1.5 text-xs text-accent-strong"
                    >{{ t('weekly.thisWeek') }}</span
                  >
                </th>
                <td class="px-3 py-2">
                  <span
                    v-if="row.week.snapshot"
                    class="flex w-40 items-center gap-2"
                  >
                    <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                      <span
                        class="block h-full rounded-full bg-success-mark"
                        :style="{ width: percent(row.week.snapshot.overall.progress) }"
                      />
                    </span>
                    <span class="w-10 text-right font-semibold tabular-nums">{{ percent(row.week.snapshot.overall.progress) }}</span>
                  </span>
                  <span
                    v-else
                    class="text-xs text-content-muted"
                    >{{ t('weekly.progress.notRecorded') }}</span
                  >
                </td>
                <td :class="['px-3 py-2 text-right tabular-nums', (row.delta ?? 0) < 0 ? 'text-danger' : '']">
                  {{ row.delta === null ? '' : signedPercent(row.delta) }}
                </td>
                <td class="px-3 py-2 text-right text-content-muted tabular-nums">
                  {{ row.week.snapshot ? percent(row.week.snapshot.overall.timeElapsed) : '' }}
                </td>
                <td
                  v-for="stage in stageColumns"
                  :key="stage.stageId"
                  class="px-3 py-2 text-right tabular-nums"
                >
                  {{ row.week.snapshot ? percent(row.week.snapshot.stages.find((figures) => figures.stageId === stage.stageId)?.progress ?? null) : '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 2. The chosen week: summary and hours. -->
      <section
        v-if="selected"
        class="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-bold">{{ t('weekly.detail.title', { week: weekLabel(selected.weekStart) }) }}</h2>
          <AppSelect
            v-model="selectedWeek"
            class="w-56"
            :aria-label="t('weekly.week')"
            :options="weekOptions"
          />
        </div>

        <form
          v-if="report.canEdit"
          class="flex flex-col gap-4"
          @submit.prevent="handleSaveWeek"
        >
          <AppLocalizedField
            v-model="summaryDraft"
            :label="t('weekly.detail.summary')"
            :max-length="5000"
            is-multiline
            :rows="6"
          />
          <p class="-mt-2 text-xs text-content-muted">{{ t('weekly.detail.summaryHint') }}</p>

          <fieldset class="flex flex-col gap-2">
            <legend class="mb-1 text-sm font-semibold">{{ t('weekly.detail.hours') }}</legend>
            <p
              v-if="!report.members.length"
              class="text-sm text-content-muted"
            >
              {{ t('weekly.detail.noMembers') }}
            </p>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <label
                v-for="member in report.members"
                :key="member.id"
                class="flex items-center justify-between gap-3 rounded-control border border-line px-3 py-2 text-sm"
              >
                <span class="min-w-0">
                  <span class="block truncate font-medium">{{ member.name }}</span>
                  <span
                    v-if="member.title"
                    class="text-xs text-content-muted"
                    >{{ member.title }}</span
                  >
                </span>
                <span class="flex items-center gap-1.5">
                  <input
                    v-model.number="hoursDraft[member.id]"
                    type="number"
                    min="0"
                    max="168"
                    step="0.5"
                    inputmode="decimal"
                    class="min-h-9 w-20 rounded-control border border-line-strong bg-surface px-2 text-right text-sm tabular-nums"
                    :aria-label="t('weekly.detail.hoursOf', { name: member.name })"
                  />
                  <span class="text-xs text-content-muted">{{ t('weekly.detail.hoursUnit') }}</span>
                </span>
              </label>
            </div>
          </fieldset>

          <p
            v-if="saving.hasFailed.value"
            role="alert"
            class="text-sm text-danger"
          >
            {{ saving.errorMessage.value }}
          </p>
          <div class="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            <p
              v-if="isSaved && !isDirty"
              role="status"
              class="mr-auto text-sm font-semibold text-success"
            >
              ✓ {{ t('weekly.detail.saved') }}
            </p>
            <AppButton
              variant="secondary"
              :is-disabled="!isDirty || saving.isPending.value"
              @click="resetDraft"
              >{{ t('common.unsaved.discard') }}</AppButton
            >
            <AppButton
              type="submit"
              :is-disabled="!isDirty || saving.isPending.value"
              >{{ saving.isPending.value ? t('common.actions.saving') : t('common.actions.save') }}</AppButton
            >
          </div>
        </form>

        <template v-else>
          <AppLocalizedText
            v-if="selected.summary"
            :text="selected.summary"
            class="text-sm whitespace-pre-line"
          />
          <p
            v-else
            class="text-sm text-content-muted"
          >
            {{ t('weekly.detail.noSummary') }}
          </p>
        </template>
      </section>

      <!-- 3. Hours per member per week. -->
      <section class="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <h2 class="text-lg font-bold">{{ t('weekly.hours.title') }}</h2>
        <p
          v-if="!totalHours"
          class="text-sm text-content-muted"
        >
          {{ t('weekly.hours.empty') }}
        </p>
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full min-w-max text-sm">
            <caption class="sr-only">
              {{
                t('weekly.hours.title')
              }}
            </caption>
            <thead class="bg-toolbar text-xs text-content-muted">
              <tr>
                <th
                  scope="col"
                  class="sticky left-0 bg-toolbar px-3 py-2 text-left font-semibold"
                >
                  {{ t('weekly.hours.member') }}
                </th>
                <th
                  scope="col"
                  class="px-3 py-2 text-right font-semibold"
                >
                  {{ t('weekly.hours.total') }}
                </th>
                <th
                  v-for="week in weeksWithHours"
                  :key="week.weekStart"
                  scope="col"
                  class="px-3 py-2 text-right font-semibold whitespace-nowrap"
                >
                  {{ weekLabel(week.weekStart) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="member in report.members"
                :key="member.id"
                class="border-t border-line"
              >
                <th
                  scope="row"
                  class="sticky left-0 bg-surface px-3 py-2 text-left font-medium"
                >
                  {{ member.name }}
                </th>
                <td class="px-3 py-2 text-right font-semibold tabular-nums">{{ number(hoursOf(member.id)) }}</td>
                <td
                  v-for="week in weeksWithHours"
                  :key="week.weekStart"
                  class="px-3 py-2 text-right tabular-nums"
                >
                  {{ week.hours[member.id] ? number(week.hours[member.id]!) : '' }}
                </td>
              </tr>
              <tr class="border-t-2 border-line-strong font-semibold">
                <th
                  scope="row"
                  class="sticky left-0 bg-surface px-3 py-2 text-left"
                >
                  {{ t('weekly.hours.total') }}
                </th>
                <td class="px-3 py-2 text-right tabular-nums">{{ number(totalHours) }}</td>
                <td
                  v-for="week in weeksWithHours"
                  :key="week.weekStart"
                  class="px-3 py-2 text-right tabular-nums"
                >
                  {{ number(sum(Object.values(week.hours))) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import AppTopbar from '@/components/layout/AppTopbar.vue';
import ProjectNav from '@/components/project/ProjectNav.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import { planExportUrl, recordPlanWeek, updatePlanWeek } from '@/api/plan/plan';
import { resolveLocalizedText } from '@/utils/content-language';
import type { LocalizedText } from '~~/shared/contracts/content';

const { t, locale } = useI18n();
const localePath = useLocalePath();
const { code } = useProjectRoute();
const { contentLanguage } = useContentLanguage();
const { data: projectScreens } = await useProjectScreens(code);
const { data: report, isPending, hasFailed, errorMessage, refresh } = await usePlanWeekly(code);

const projectName = computed(() =>
  projectScreens.value ? resolveLocalizedText(projectScreens.value.project.name, contentLanguage.value.primary).value : code.value,
);

// Newest week first: the current week is what people come to fill in.
const weeksNewestFirst = computed(() => [...(report.value?.weeks ?? [])].reverse());
const currentWeek = computed(() => report.value?.weeks.find((week) => week.weekStart === report.value?.currentWeek) ?? null);
const selectedWeek = ref<string | null>(null);
const selected = computed(() => report.value?.weeks.find((week) => week.weekStart === selectedWeek.value) ?? null);

watch(
  report,
  (value) => {
    if (value && !value.weeks.some((week) => week.weekStart === selectedWeek.value)) {
      selectedWeek.value = value.currentWeek;
    }
  },
  { immediate: true },
);

// Stage columns come from the latest recorded week, so renamed or removed stages keep their history.
const stageColumns = computed(() => weeksNewestFirst.value.find((week) => week.snapshot)?.snapshot?.stages ?? []);
// The change is against the week just before, and only when both weeks were recorded.
const progressRows = computed(() => {
  const weeks = report.value?.weeks ?? [];

  return weeks
    .map((week, index) => {
      const progress = week.snapshot?.overall.progress ?? null;
      const previous = weeks[index - 1]?.snapshot?.overall.progress ?? null;

      return { week, delta: progress !== null && previous !== null ? progress - previous : null };
    })
    .reverse();
});
const weekOptions = computed(() =>
  weeksNewestFirst.value.map((week) => ({
    value: week.weekStart,
    label: weekLabel(week.weekStart),
    hint: week.weekStart === report.value?.currentWeek ? t('weekly.thisWeek') : undefined,
  })),
);

const weeksWithHours = computed(() => weeksNewestFirst.value.filter((week) => Object.keys(week.hours).length));
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const totalHours = computed(() => sum((report.value?.weeks ?? []).flatMap((week) => Object.values(week.hours))));

function hoursOf(memberId: number): number {
  return sum((report.value?.weeks ?? []).map((week) => week.hours[memberId] ?? 0));
}

// The week being edited: its summary in every content language and each member's hours.
const summaryDraft = ref<LocalizedText>({ vi: null });
const hoursDraft = ref<Record<number, number | ''>>({});
const savedDraft = computed(() => JSON.stringify({ summary: selected.value?.summary ?? { vi: null }, hours: selectedHours() }));
const isDirty = computed(() => JSON.stringify({ summary: summaryDraft.value, hours: normalizedHours() }) !== savedDraft.value);
const isSaved = ref(false);

function selectedHours(): Record<number, number | null> {
  return Object.fromEntries((report.value?.members ?? []).map((member) => [member.id, selected.value?.hours[member.id] ?? null]));
}

function normalizedHours(): Record<number, number | null> {
  return Object.fromEntries(
    (report.value?.members ?? []).map((member) => [
      member.id,
      typeof hoursDraft.value[member.id] === 'number' ? (hoursDraft.value[member.id] as number) : null,
    ]),
  );
}

function resetDraft(): void {
  summaryDraft.value = { ...(selected.value?.summary ?? { vi: null }) };
  hoursDraft.value = Object.fromEntries(Object.entries(selectedHours()).map(([id, hours]) => [id, hours ?? '']));
}

watch(
  selected,
  () => {
    resetDraft();
    isSaved.value = false;
  },
  { immediate: true },
);
useUnsavedChanges(isDirty);

const saving = useAppRequest(updatePlanWeek);
const recording = useAppRequest(recordPlanWeek);

async function handleSaveWeek(): Promise<void> {
  const week = selectedWeek.value;

  if (!week) {
    return;
  }

  const summary = Object.fromEntries(Object.entries(summaryDraft.value).map(([language, text]) => [language, text?.trim() || null])) as LocalizedText;

  if (await saving.execute(code.value, week, { summary, hours: normalizedHours() })) {
    await refresh();
    isSaved.value = true;
  }
}

async function handleRecord(): Promise<void> {
  if (report.value && (await recording.execute(code.value, report.value.currentWeek))) {
    await refresh();
  }
}

function weekLabel(weekStart: string): string {
  const monday = new Date(`${weekStart}T00:00:00Z`);
  const friday = new Date(monday.getTime() + 4 * 86_400_000);
  const format = new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'numeric', timeZone: 'UTC' });

  return `${format.format(monday)} – ${format.format(friday)}/${monday.getUTCFullYear()}`;
}

function percent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

function signedPercent(value: number): string {
  const rounded = Math.round(value * 100);

  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

function number(value: number): string {
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value);
}

useSeoMeta({ title: () => `${t('weekly.title')} · ${projectName.value}` });
</script>
