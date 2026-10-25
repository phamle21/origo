<template>
  <li
    class="rounded-control pl-3"
    :style="{ backgroundColor: task ? `color-mix(in srgb, ${stage.color} 9%, var(--app-color-surface))` : 'var(--app-color-surface)' }"
  >
    <div class="flex flex-col gap-1 py-2 pr-2">
      <div class="flex flex-wrap items-center gap-2">
        <!-- The stage's own colour, the same as its bar in the chart. -->
        <span
          aria-hidden="true"
          class="size-2.5 shrink-0 rounded-full"
          :style="{ backgroundColor: stage.color }"
        />
        <span class="min-w-0 flex-1 text-sm font-semibold break-words">{{ stageName }}</span>
        <PlanStatusBadge
          v-if="task"
          :status="statusOfTask(task, statuses)"
          :category="task.status"
          :language="language"
        />
        <span
          v-else
          class="text-xs font-medium text-content-muted"
          >{{ t('plan.task.notScheduled') }}</span
        >
        <button
          v-if="canEdit && !isEditing"
          type="button"
          :class="[
            'inline-flex min-h-8 items-center gap-1 rounded-control px-2.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            task ? 'text-accent-strong hover:bg-surface' : 'bg-accent text-accent-contrast hover:bg-accent-strong',
          ]"
          @click="startEditing"
        >
          <AppIcon
            :name="task ? 'pencil' : 'plus'"
            :size="14"
          />
          {{ t(task ? 'plan.task.edit' : 'plan.task.schedule') }}
        </button>
      </div>

      <form
        v-if="isEditing"
        class="mt-1 grid grid-cols-2 gap-2 rounded-control bg-surface p-2.5"
        @submit.prevent="handleSave"
      >
        <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
          {{ t('plan.task.start') }}
          <input
            v-model="draft.startDate"
            type="date"
            required
            class="min-h-9 rounded-control border border-line-strong bg-surface px-2 text-sm font-normal text-content"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
          {{ t('plan.task.end') }}
          <input
            v-model="draft.endDate"
            type="date"
            required
            :min="draft.startDate"
            class="min-h-9 rounded-control border border-line-strong bg-surface px-2 text-sm font-normal text-content"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
          {{ t('plan.task.status') }}
          <AppSelect
            v-model="draft.statusId"
            size="sm"
            class="w-full font-normal"
            :options="statusOptions"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
          {{ t('plan.task.assignee') }}
          <AppSelect
            v-model="draft.assigneeId"
            size="sm"
            class="w-full font-normal"
            :options="[
              { value: null, label: t('plan.task.nobody') },
              ...members.map((member) => ({ value: member.user.id, label: member.user.name, hint: member.user.title ?? undefined })),
            ]"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
          {{ t('plan.task.estimate') }}
          <input
            v-model.number="draft.estimateDays"
            type="number"
            min="0"
            max="999"
            step="0.25"
            inputmode="decimal"
            :placeholder="t('plan.task.estimatePlaceholder')"
            class="min-h-9 rounded-control border border-line-strong bg-surface px-2 text-sm font-normal text-content"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
          {{ t('plan.task.progress') }}
          <input
            v-model.number="draft.progress"
            type="number"
            min="0"
            max="100"
            step="5"
            inputmode="numeric"
            :disabled="isDraftDone"
            :placeholder="isDraftDone ? '100' : '0'"
            class="min-h-9 rounded-control border border-line-strong bg-surface px-2 text-sm font-normal text-content disabled:opacity-60"
          />
        </label>
        <label class="col-span-2 flex flex-col gap-1 text-xs font-semibold text-content-muted">
          {{ t('plan.task.link') }}
          <input
            v-model="draft.link"
            type="text"
            maxlength="2048"
            :placeholder="t('plan.task.linkPlaceholder')"
            class="min-h-9 rounded-control border border-line-strong bg-surface px-2 text-sm font-normal text-content"
          />
        </label>
        <label class="col-span-2 flex flex-col gap-1 text-xs font-semibold text-content-muted">
          {{ t('plan.task.note') }}
          <textarea
            v-model="draft.note"
            rows="2"
            maxlength="2000"
            class="rounded-control border border-line-strong bg-surface px-2 py-1.5 text-sm font-normal text-content"
          />
        </label>
        <p
          v-if="progressError"
          class="col-span-2 text-xs text-danger"
        >
          {{ progressError }}
        </p>
        <p
          v-if="draft.endDate < draft.startDate"
          class="col-span-2 text-xs text-danger"
        >
          {{ t('plan.task.endBeforeStart') }}
        </p>
        <div class="col-span-2 flex flex-wrap gap-2">
          <AppButton
            type="submit"
            :is-disabled="draft.endDate < draft.startDate || Boolean(progressError)"
            >{{ t('common.actions.save') }}</AppButton
          >
          <AppButton
            variant="secondary"
            @click="isEditing = false"
            >{{ t('common.actions.cancel') }}</AppButton
          >
          <AppButton
            v-if="task"
            variant="secondary"
            @click="emit('remove')"
            >{{ t('plan.task.remove') }}</AppButton
          >
        </div>
      </form>

      <div
        v-else-if="task"
        class="flex flex-col gap-1"
      >
        <p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span class="inline-flex items-center gap-1.5 tabular-nums">
            <AppIcon
              name="calendar"
              :size="14"
              class="text-content-muted"
            /><span class="sr-only">{{ t('plan.task.dates') }}:</span> {{ formatShort(task.startDate) }} → {{ formatShort(task.endDate) }}
            <span class="text-content-muted">· {{ t('plan.gantt.days', durationOf(task)) }}</span>
          </span>
          <span :class="['inline-flex items-center gap-1.5', assignee ? '' : 'text-content-muted']">
            <AppIcon
              name="user"
              :size="14"
              class="text-content-muted"
            /><span class="sr-only">{{ t('plan.task.assignee') }}:</span>
            {{ assignee || t('plan.task.nobody') }}
          </span>
          <span
            v-if="task.estimateDays !== null"
            class="inline-flex items-center gap-1.5 tabular-nums"
          >
            <AppIcon
              name="clock"
              :size="14"
              class="text-content-muted"
            />{{ t('plan.task.estimateValue', { days: formatNumber(task.estimateDays) }) }}
          </span>
          <span
            v-if="task.status !== 'done' && task.progress"
            class="inline-flex items-center gap-1.5 tabular-nums"
            >{{ t('plan.task.progressValue', { percent: task.progress }) }}</span
          >
        </p>
        <p
          v-if="task.link"
          class="flex min-w-0 items-center gap-1.5 text-sm"
        >
          <AppIcon
            name="link"
            :size="14"
            class="shrink-0 text-content-muted"
          />
          <a
            v-if="isUrl(task.link)"
            :href="task.link"
            target="_blank"
            rel="noopener noreferrer"
            class="truncate font-medium text-accent-strong hover:underline"
            >{{ task.link }}</a
          >
          <span
            v-else
            class="truncate"
            >{{ task.link }}</span
          >
        </p>
        <p
          v-if="task.note"
          class="text-sm whitespace-pre-line text-content-muted"
        >
          {{ task.note }}
        </p>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import PlanStatusBadge from '@/components/plan/PlanStatusBadge.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { durationInDays, toDayNumber } from '@/utils/plan-dates';
import { PLAN_STATUS_CATEGORIES, statusOfTask } from '@/utils/plan-status';
import type { ProjectMember } from '~~/shared/contracts/member';
import type { PlanStatus, PlanTask, PlanTaskPayload } from '~~/shared/contracts/plan';

const props = defineProps<{
  stage: { id: string; color: string };
  stageName: string;
  task: PlanTask | null;
  /** The project's own statuses, ordered. */
  statuses: PlanStatus[];
  language: string;
  members: ProjectMember[];
  canEdit: boolean;
  /** Where a new task starts by default, usually the day after the previous stage ends. */
  suggestedDates: { startDate: string; endDate: string };
  /** Opens straight in edit mode, e.g. after clicking the stage's bar. */
  startsEditing?: boolean;
}>();

const emit = defineEmits<{ save: [payload: PlanTaskPayload]; remove: [] }>();

const { t, locale } = useI18n();
const isEditing = ref(false);
interface TaskDraft {
  startDate: string;
  endDate: string;
  statusId: string | null;
  assigneeId: number | null;
  /** Number inputs give '' when cleared. */
  estimateDays: number | '' | null;
  progress: number | '' | null;
  link: string;
  note: string;
}

const draft = reactive<TaskDraft>({ startDate: '', endDate: '', statusId: null, assigneeId: null, estimateDays: null, progress: null, link: '', note: '' });

// Statuses grouped by category in the list, the category named in the hint line.
const statusOptions = computed(() =>
  PLAN_STATUS_CATEGORIES.flatMap((category) =>
    props.statuses
      .filter((status) => status.category === category)
      .map((status) => ({ value: status.id, label: resolveLocalizedText(status.name, props.language).value, hint: t(`plan.status.${category}`) })),
  ),
);
const isDraftDone = computed(() => props.statuses.find((status) => status.id === draft.statusId)?.category === 'done');
const progressError = computed(() =>
  typeof draft.progress === 'number' && (draft.progress < 0 || draft.progress > 100 || !Number.isInteger(draft.progress)) ? t('plan.task.progressRange') : '',
);

const assignee = computed(() => props.members.find((member) => member.user.id === props.task?.assigneeId)?.user.name ?? '');

function formatShort(isoDate: string): string {
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(isoDate));
}

function durationOf(task: PlanTask): number {
  return durationInDays({ start: toDayNumber(task.startDate), end: toDayNumber(task.endDate) });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value);
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function startEditing(): void {
  const task = props.task;

  Object.assign(
    draft,
    task
      ? {
          startDate: task.startDate,
          endDate: task.endDate,
          statusId: statusOfTask(task, props.statuses)?.id ?? null,
          assigneeId: task.assigneeId,
          estimateDays: task.estimateDays,
          progress: task.progress,
          link: task.link ?? '',
          note: task.note ?? '',
        }
      : {
          ...props.suggestedDates,
          statusId: props.statuses.find((status) => status.category === 'todo')?.id ?? null,
          assigneeId: null,
          estimateDays: null,
          progress: null,
          link: '',
          note: '',
        },
  );
  isEditing.value = true;
}

const toNumber = (value: number | '' | null) => (value === '' || value === null ? null : value);

onMounted(() => {
  if (props.startsEditing && props.canEdit) {
    startEditing();
  }
});

function handleSave(): void {
  const payload: PlanTaskPayload = {
    startDate: draft.startDate,
    endDate: draft.endDate,
    assigneeId: draft.assigneeId,
    estimateDays: toNumber(draft.estimateDays),
    progress: toNumber(draft.progress),
    link: draft.link.trim() || null,
    note: draft.note.trim() || null,
  };

  emit('save', draft.statusId ? { ...payload, statusId: draft.statusId } : { ...payload, status: 'todo' });
  isEditing.value = false;
}
</script>
