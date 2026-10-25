<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.settings'), to: localePath('/settings') }, { label: t('layout.sectionNav.calendar') }]" />

  <div class="flex flex-col gap-4 px-4 py-8 sm:px-6">
    <AppPageSkeleton
      v-if="isPending && !data"
      variant="form"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <AppFormCard
      v-else
      form-id="calendar-form"
      tile="settings"
      :title="t('settings.calendar.title')"
      :description="t('settings.calendar.description')"
      :error="saving.hasFailed.value ? saving.errorMessage.value : ''"
      @submit="handleSave"
    >
      <AppFormSection
        :number="1"
        :title="t('settings.calendar.days')"
        :description="t('settings.calendar.daysHint')"
      >
        <p
          v-if="!draft.length"
          class="rounded-control border border-dashed border-line-strong px-4 py-6 text-center text-sm text-content-muted"
        >
          {{ t('settings.calendar.empty') }}
        </p>
        <template
          v-for="group in groups"
          :key="group.year"
        >
          <h3 class="mt-2 text-sm font-bold text-content-muted">
            {{ group.year || t('settings.calendar.noDate') }} ·
            {{ t('settings.calendar.counts', { holidays: group.holidays, workdays: group.workdays }) }}
          </h3>
          <ul class="flex flex-col gap-2">
            <li
              v-for="entry in group.entries"
              :key="entry.key"
              class="flex flex-wrap items-start gap-2 rounded-control border border-line bg-surface p-2 md:flex-nowrap"
            >
              <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
                <span class="sr-only">{{ t('settings.calendar.date') }}</span>
                <input
                  v-model="entry.day.date"
                  type="date"
                  required
                  :aria-label="t('settings.calendar.date')"
                  :aria-invalid="Boolean(dateError(entry.day)) || undefined"
                  class="min-h-10 rounded-control border border-line-strong bg-surface px-2 text-sm font-normal text-content"
                />
                <span
                  v-if="dateError(entry.day)"
                  class="text-xs font-normal text-danger"
                  >{{ dateError(entry.day) }}</span
                >
              </label>
              <span class="mt-2.5 w-10 shrink-0 text-xs text-content-muted">{{ weekday(entry.day.date) }}</span>
              <AppSelect
                v-model="entry.day.kind"
                class="w-40"
                :aria-label="t('settings.calendar.kind')"
                :options="KINDS.map((kind) => ({ value: kind, label: t(`settings.calendar.kinds.${kind}`) }))"
              />
              <AppTextField
                v-model="entry.day.name"
                class="min-w-40 flex-1"
                :label="t('settings.calendar.name')"
                is-label-hidden
                :max-length="80"
              />
              <AppButton
                variant="danger"
                :aria-label="t('settings.calendar.remove', { date: entry.day.date })"
                @click="remove(entry.day)"
              >
                <AppIcon
                  name="trash"
                  :size="16"
                />
              </AppButton>
            </li>
          </ul>
        </template>
        <AppButton
          variant="secondary"
          class="self-start"
          :is-disabled="draft.length >= MAX_DAYS"
          @click="add"
        >
          <span class="inline-flex items-center gap-1.5"><AppIcon name="plus" />{{ t('settings.calendar.add') }}</span>
        </AppButton>
      </AppFormSection>

      <template #actions>
        <AppButton
          variant="secondary"
          :is-disabled="!isDirty || saving.isPending.value"
          @click="restore"
          >{{ t('common.unsaved.discard') }}</AppButton
        >
        <AppButton
          type="submit"
          :is-disabled="!isDirty || saving.isPending.value || hasErrors"
          >{{ saving.isPending.value ? t('common.actions.saving') : t('common.actions.save') }}</AppButton
        >
      </template>
    </AppFormCard>

    <AppUnsavedBar
      class="max-w-5xl"
      :show="isDirty"
      :is-saving="saving.isPending.value"
      form="calendar-form"
      :hint="t('settings.calendar.unsavedHint')"
      @discard="restore"
    />
  </div>
</template>

<script setup lang="ts">
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppFormCard from '@/components/ui/AppFormCard.vue';
import AppFormSection from '@/components/ui/AppFormSection.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTextField from '@/components/ui/AppTextField.vue';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';
import { fetchWorkCalendar, saveWorkCalendar } from '@/api/settings/settings';
import type { WorkCalendarDay } from '~~/shared/contracts/plan';

/**
 * Exceptions to the Monday–Friday week for every project: public holidays (not worked) and make-up days
 * (a weekend day that is worked). Plans count working days with them.
 */
const KINDS: WorkCalendarDay['kind'][] = ['holiday', 'workday'];
const MAX_DAYS = 1_000;

interface DraftDay {
  date: string;
  kind: WorkCalendarDay['kind'];
  name: string;
}

const { t, locale } = useI18n();
const localePath = useLocalePath();

if (!useSystemAccess().canManageSettings.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const { data, isPending, hasFailed, errorMessage, refresh } = await useRouteResource('work-calendar', () => fetchWorkCalendar());
const saving = useAppRequest(saveWorkCalendar);
const draft = ref<DraftDay[]>([]);
// Rows keep a stable key while their date is being typed.
const keys = new WeakMap<DraftDay, number>();
let nextKey = 0;

const saved = computed<DraftDay[]>(() => (data.value ?? []).map((day) => ({ date: day.date, kind: day.kind, name: day.name ?? '' })));
const isDirty = computed(() => JSON.stringify(sorted(draft.value)) !== JSON.stringify(saved.value));
const duplicates = computed(() => {
  const counts = new Map<string, number>();

  for (const day of draft.value) {
    counts.set(day.date, (counts.get(day.date) ?? 0) + 1);
  }

  return new Set([...counts].filter(([, count]) => count > 1).map(([date]) => date));
});
const hasErrors = computed(() => draft.value.some((day) => dateError(day)));

// Grouped by year, newest year first, each in date order; a row without a date yet stays at the top.
const groups = computed(() => {
  const byYear = new Map<string, DraftDay[]>();

  for (const day of sorted(draft.value)) {
    const year = day.date.slice(0, 4);

    byYear.set(year, [...(byYear.get(year) ?? []), day]);
  }

  return [...byYear]
    .sort(([left], [right]) => (left === '' ? -1 : right === '' ? 1 : right.localeCompare(left)))
    .map(([year, days]) => ({
      year,
      holidays: days.filter((day) => day.kind === 'holiday').length,
      workdays: days.filter((day) => day.kind === 'workday').length,
      entries: days.map((day) => ({ day, key: keyOf(day) })),
    }));
});

function keyOf(day: DraftDay): number {
  const known = keys.get(day);

  if (known !== undefined) {
    return known;
  }

  keys.set(day, nextKey);

  return nextKey++;
}

function sorted(days: DraftDay[]): DraftDay[] {
  return [...days].sort((left, right) => left.date.localeCompare(right.date));
}

function dateError(day: DraftDay): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
    return t('validation.required');
  }

  return duplicates.value.has(day.date) ? t('settings.calendar.duplicate') : '';
}

function weekday(date: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Intl.DateTimeFormat(locale.value, { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
    : '';
}

function restore(): void {
  draft.value = saved.value.map((day) => ({ ...day }));
}

watch(saved, restore, { immediate: true });
useUnsavedChanges(isDirty);

function add(): void {
  draft.value.push({ date: '', kind: 'holiday', name: '' });
}

function remove(day: DraftDay): void {
  draft.value = draft.value.filter((candidate) => candidate !== day);
}

async function handleSave(): Promise<void> {
  if (hasErrors.value) {
    return;
  }
  if (await saving.execute(sorted(draft.value).map((day) => ({ date: day.date, kind: day.kind, name: day.name.trim() || null })))) {
    await refresh();
  }
}

useSeoMeta({ title: () => t('settings.calendar.title') });
</script>
