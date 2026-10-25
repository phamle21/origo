<template>
  <details
    class="group rounded-card border border-line bg-surface shadow-card"
    :open="isOpen"
    @toggle="isOpen = ($event.currentTarget as HTMLDetailsElement).open"
  >
    <summary class="flex min-h-12 cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
      <span class="flex items-center gap-2 text-sm font-bold">
        <AppIcon
          name="chevronRight"
          :size="14"
          class="transition-transform group-open:rotate-90"
        />
        {{ t('plan.summary.title') }}
      </span>
      <span class="flex min-w-48 flex-1 items-center gap-2">
        <span class="text-2xl font-bold tabular-nums">{{ percent(overall.progress) }}</span>
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <span
            class="h-2 overflow-hidden rounded-full bg-neutral-soft"
            role="progressbar"
            :aria-label="t('plan.summary.progress')"
            :aria-valuenow="Math.round((overall.progress ?? 0) * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span
              class="block h-full rounded-full bg-success-mark"
              :style="{ width: percent(overall.progress) }"
            />
          </span>
          <span class="text-xs text-content-muted tabular-nums">{{ effortLine }}</span>
        </span>
      </span>
      <span
        v-if="overall.timeElapsed !== null"
        class="flex min-w-48 flex-1 items-center gap-2"
      >
        <span :class="['text-2xl font-bold tabular-nums', isBehind ? 'text-danger' : '']">{{ percent(overall.timeElapsed) }}</span>
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <span
            class="h-2 overflow-hidden rounded-full bg-neutral-soft"
            role="progressbar"
            :aria-label="t('plan.summary.timeElapsed')"
            :aria-valuenow="Math.round(overall.timeElapsed * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span
              :class="['block h-full rounded-full', isBehind ? 'bg-danger' : 'bg-info']"
              :style="{ width: percent(overall.timeElapsed) }"
            />
          </span>
          <span class="text-xs text-content-muted tabular-nums">{{
            t('plan.summary.daysLine', {
              passed: overall.workingDaysPassed,
              total: overall.workingDays,
              remain: (overall.workingDays ?? 0) - (overall.workingDaysPassed ?? 0),
            })
          }}</span>
        </span>
      </span>
      <AppBadge
        v-if="isBehind"
        tone="danger"
        >{{ t('plan.summary.behind') }}</AppBadge
      >
    </summary>

    <div class="overflow-x-auto border-t border-line">
      <table class="w-full min-w-[44rem] text-sm">
        <caption class="sr-only">
          {{
            t('plan.summary.byStage')
          }}
        </caption>
        <thead class="bg-toolbar text-xs text-content-muted">
          <tr>
            <th
              scope="col"
              class="px-4 py-2 text-left font-semibold"
            >
              {{ t('plan.summary.stage') }}
            </th>
            <th
              scope="col"
              class="px-3 py-2 text-left font-semibold"
            >
              {{ t('plan.summary.window') }}
            </th>
            <th
              scope="col"
              class="px-3 py-2 text-right font-semibold"
            >
              {{ t('plan.summary.estimate') }}
            </th>
            <th
              scope="col"
              class="px-3 py-2 text-right font-semibold"
            >
              {{ t('plan.summary.actual') }}
            </th>
            <th
              scope="col"
              class="px-3 py-2 text-right font-semibold"
            >
              {{ t('plan.summary.remaining') }}
            </th>
            <th
              scope="col"
              class="w-48 px-4 py-2 text-left font-semibold"
            >
              {{ t('plan.summary.progress') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in stageRows"
            :key="row.stageId"
            class="border-t border-line"
          >
            <th
              scope="row"
              class="px-4 py-2 text-left font-semibold"
            >
              <span class="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  class="size-2.5 shrink-0 rounded-full"
                  :style="{ backgroundColor: row.color }"
                />
                <span class="min-w-0 break-words">{{ row.name }}</span>
                <span
                  v-if="row.owner"
                  class="rounded bg-neutral-soft px-1.5 text-xs font-medium text-content-muted"
                  >{{ row.owner }}</span
                >
              </span>
            </th>
            <td class="px-3 py-2 text-xs whitespace-nowrap text-content-muted tabular-nums">
              <template v-if="row.startDate && row.endDate">
                {{ formatDay(row.startDate) }} – {{ formatDay(row.endDate) }}
                <span class="block">{{ t('plan.summary.workingDays', { count: row.workingDays ?? 0 }) }}</span>
              </template>
              <span v-else>—</span>
            </td>
            <td class="px-3 py-2 text-right tabular-nums">{{ row.basis === 'effort' ? number(row.estimateDays) : '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums">{{ row.basis === 'effort' ? number(row.actualDays) : '—' }}</td>
            <td class="px-3 py-2 text-right tabular-nums">{{ row.basis === 'effort' ? number(row.remainingDays) : '—' }}</td>
            <td class="px-4 py-2">
              <span class="flex items-center gap-2">
                <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-soft">
                  <span
                    class="block h-full rounded-full"
                    :style="{ width: percent(row.progress), backgroundColor: row.color }"
                  />
                </span>
                <span class="w-11 text-right text-xs font-semibold tabular-nums">{{ percent(row.progress) }}</span>
                <AppBadge
                  v-if="row.isLate"
                  tone="danger"
                  >{{ t('plan.summary.late') }}</AppBadge
                >
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="border-t border-line px-4 py-2 text-xs text-content-muted">
        {{ t(overall.basis === 'effort' ? 'plan.summary.basisEffort' : 'plan.summary.basisCount') }}
      </p>
    </div>
  </details>
</template>

<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import type { ContentLocale } from '~~/shared/contracts/content';
import type { PlanStage, PlanSummary } from '~~/shared/contracts/plan';

/**
 * The plan's progress at a glance, like the summary rows of a project spreadsheet: work done against
 * work planned (man-days, or tasks without estimates) and working time passed, overall and per stage.
 */
const props = defineProps<{ summary: PlanSummary; stages: PlanStage[]; language: ContentLocale }>();

const { t, locale } = useI18n();
const isOpen = ref(false);
const overall = computed(() => props.summary.overall);
// Behind schedule: clearly more working time has passed than work has been done.
const BEHIND_MARGIN = 0.1;
const isBehind = computed(
  () => overall.value.timeElapsed !== null && overall.value.progress !== null && overall.value.timeElapsed - overall.value.progress > BEHIND_MARGIN,
);

const stageRows = computed(() => {
  const stages = new Map(props.stages.map((stage) => [stage.id, stage]));

  return props.summary.stages.map((figures) => {
    const stage = stages.get(figures.stageId);

    return { ...figures, name: stage ? resolveLocalizedText(stage.name, props.language).value : '', color: stage?.color ?? '#64748b' };
  });
});

const effortLine = computed(() =>
  overall.value.basis === 'effort'
    ? t('plan.summary.effortLine', {
        actual: number(overall.value.actualDays),
        estimate: number(overall.value.estimateDays),
        remain: number(overall.value.remainingDays),
      })
    : t('plan.summary.countLine', { done: overall.value.doneCount, total: overall.value.taskCount }),
);

function percent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

function number(value: number): string {
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value);
}

function formatDay(isoDate: string): string {
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(isoDate));
}
</script>
