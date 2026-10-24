<template>
  <div
    role="search"
    :aria-label="t('plan.filter.label')"
    class="flex flex-col gap-2 border-t border-line pt-2"
  >
    <div class="flex flex-wrap items-center gap-2">
      <label class="relative min-w-48 flex-1 sm:max-w-64">
        <span class="sr-only">{{ t('plan.filter.search') }}</span>
        <span class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-content-muted"
          ><AppIcon
            name="search"
            :size="16"
        /></span>
        <input
          :value="modelValue.query"
          type="search"
          maxlength="100"
          :placeholder="t('plan.filter.searchPlaceholder')"
          class="min-h-9 w-full rounded-control border border-line-strong bg-surface pr-2 pl-8 text-sm"
          @input="update({ query: ($event.target as HTMLInputElement).value })"
        />
      </label>
      <label class="flex items-center gap-1.5 text-sm text-content-muted">
        <span class="sr-only sm:not-sr-only">{{ t('plan.filter.assignee') }}</span>
        <AppSelect
          :model-value="assigneeValue"
          size="sm"
          class="min-w-40"
          :aria-label="t('plan.filter.assignee')"
          :is-highlighted="modelValue.assignee !== null"
          :options="assigneeOptions"
          @update:model-value="handleAssignee(String($event ?? ''))"
        />
      </label>
      <label class="flex items-center gap-1.5 text-sm text-content-muted">
        <span class="sr-only sm:not-sr-only">{{ t('plan.filter.stage') }}</span>
        <AppSelect
          :model-value="modelValue.stageId ?? ''"
          size="sm"
          class="min-w-40"
          :aria-label="t('plan.filter.stage')"
          :is-highlighted="modelValue.stageId !== null"
          :options="[
            { value: '', label: t('plan.filter.allStages') },
            ...stages.map((stage) => ({ value: stage.id, label: resolveLocalizedText(stage.name, language).value })),
          ]"
          @update:model-value="update({ stageId: $event ? String($event) : null })"
        />
      </label>
      <div
        role="group"
        :aria-label="t('plan.filter.status')"
        class="flex flex-wrap gap-1"
      >
        <button
          v-for="status in STATUSES"
          :key="status"
          type="button"
          :aria-pressed="modelValue.statuses.includes(status)"
          :class="chipClass(modelValue.statuses.includes(status))"
          @click="toggleStatus(status)"
        >
          <span
            aria-hidden="true"
            :class="['size-2 rounded-full', STATUS_DOTS[status]]"
          />
          {{ t(`plan.status.${status}`) }}
        </button>
        <button
          type="button"
          :aria-pressed="modelValue.isLateOnly"
          :class="chipClass(modelValue.isLateOnly, true)"
          @click="update({ isLateOnly: !modelValue.isLateOnly })"
        >
          <AppIcon
            name="calendar"
            :size="12"
          />
          {{ t('plan.filter.late') }}
        </button>
      </div>
    </div>
    <p
      v-if="isActive"
      role="status"
      class="flex flex-wrap items-center gap-2 text-xs text-content-muted"
    >
      <AppIcon
        name="search"
        :size="12"
      />
      {{ t('plan.filter.result', { shown: shownFeatures, total: totalFeatures }) }}
      <button
        type="button"
        class="font-semibold text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-accent"
        @click="emit('update:modelValue', emptyPlanFilter())"
      >
        {{ t('plan.filter.clear') }}
      </button>
    </p>
  </div>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { emptyPlanFilter, isPlanFilterActive, type PlanFilter } from '@/utils/plan-filter';
import type { ContentLocale } from '~~/shared/contracts/content';
import type { ProjectMember } from '~~/shared/contracts/member';
import type { PlanStage, PlanTaskStatus } from '~~/shared/contracts/plan';

const STATUSES: PlanTaskStatus[] = ['todo', 'doing', 'done'];
const STATUS_DOTS = { todo: 'bg-neutral-mark', doing: 'bg-info', done: 'bg-success-mark' } as const;

// The filters shared by the chart and the table: search by name, who owns an entry, which stage, the
// status, and entries running late. A set filter is highlighted so it is never forgotten.
const props = defineProps<{
  modelValue: PlanFilter;
  stages: PlanStage[];
  members: ProjectMember[];
  language: ContentLocale;
  /** The reader's own id among the members, for "Mine". */
  myUserId: number | null;
  shownFeatures: number;
  totalFeatures: number;
}>();

const emit = defineEmits<{ 'update:modelValue': [filter: PlanFilter] }>();

const { t } = useI18n();

const isActive = computed(() => isPlanFilterActive(props.modelValue));
const assigneeOptions = computed(() => [
  { value: '', label: t('plan.filter.everyone') },
  ...(props.myUserId !== null ? [{ value: String(props.myUserId), label: t('plan.filter.mine') }] : []),
  { value: 'none', label: t('plan.filter.unassigned') },
  ...props.members.map((member) => ({ value: String(member.user.id), label: member.user.name, hint: member.user.title ?? undefined })),
]);
const assigneeValue = computed(() => (props.modelValue.assignee === null ? '' : String(props.modelValue.assignee)));

function update(change: Partial<PlanFilter>): void {
  emit('update:modelValue', { ...props.modelValue, ...change });
}

function handleAssignee(value: string): void {
  update({ assignee: value === '' ? null : value === 'none' ? 'none' : Number(value) });
}

function toggleStatus(status: PlanTaskStatus): void {
  const statuses = props.modelValue.statuses.includes(status)
    ? props.modelValue.statuses.filter((entry) => entry !== status)
    : [...props.modelValue.statuses, status];

  update({ statuses });
}

function selectClass(isSet: boolean): string {
  return [
    'min-h-9 rounded-control border px-2 text-sm text-content',
    isSet ? 'border-accent bg-accent-soft font-semibold' : 'border-line-strong bg-surface',
  ].join(' ');
}

function chipClass(isOn: boolean, isWarning = false): string {
  return [
    'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    isOn
      ? isWarning
        ? 'border-danger bg-danger-soft text-danger'
        : 'border-accent bg-accent text-accent-contrast'
      : 'border-line-strong bg-surface text-content-muted hover:border-accent hover:text-content',
  ].join(' ');
}
</script>
