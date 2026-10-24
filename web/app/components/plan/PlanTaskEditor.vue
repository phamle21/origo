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
        <AppBadge
          v-if="task"
          :tone="STATUS_TONES[task.status]"
          >{{ task.status === 'done' ? '✓ ' : '' }}{{ t(`plan.status.${task.status}`) }}</AppBadge
        >
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
            v-model="draft.status"
            size="sm"
            class="w-full font-normal"
            :options="STATUSES.map((status) => ({ value: status, label: t(`plan.status.${status}`) }))"
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
        <p
          v-if="draft.endDate < draft.startDate"
          class="col-span-2 text-xs text-danger"
        >
          {{ t('plan.task.endBeforeStart') }}
        </p>
        <div class="col-span-2 flex flex-wrap gap-2">
          <AppButton
            type="submit"
            :is-disabled="draft.endDate < draft.startDate"
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

      <p
        v-else-if="task"
        class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
      >
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
      </p>
    </div>
  </li>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { durationInDays, toDayNumber } from '@/utils/plan-dates';
import type { ProjectMember } from '~~/shared/contracts/member';
import type { PlanTask, PlanTaskPayload, PlanTaskStatus } from '~~/shared/contracts/plan';

const STATUSES: PlanTaskStatus[] = ['todo', 'doing', 'done'];
const STATUS_TONES = { todo: 'neutral', doing: 'info', done: 'success' } as const;

const props = defineProps<{
  stage: { id: string; color: string };
  stageName: string;
  task: PlanTask | null;
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
const draft = reactive<PlanTaskPayload>({ startDate: '', endDate: '', status: 'todo', assigneeId: null });

const assignee = computed(() => props.members.find((member) => member.user.id === props.task?.assigneeId)?.user.name ?? '');

function formatShort(isoDate: string): string {
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(isoDate));
}

function durationOf(task: PlanTask): number {
  return durationInDays({ start: toDayNumber(task.startDate), end: toDayNumber(task.endDate) });
}

function startEditing(): void {
  Object.assign(
    draft,
    props.task
      ? { startDate: props.task.startDate, endDate: props.task.endDate, status: props.task.status, assigneeId: props.task.assigneeId }
      : { ...props.suggestedDates, status: 'todo', assigneeId: null },
  );
  isEditing.value = true;
}

onMounted(() => {
  if (props.startsEditing && props.canEdit) {
    startEditing();
  }
});

function handleSave(): void {
  emit('save', { ...draft });
  isEditing.value = false;
}
</script>
