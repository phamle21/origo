<template>
  <form
    :id="formId"
    novalidate
    class="flex flex-col gap-4"
    @submit.prevent="handleSubmit"
  >
    <p class="text-sm text-content-muted">{{ t('plan.stages.hint') }}</p>

    <ol class="flex flex-col gap-2">
      <template
        v-for="(stage, index) in draft"
        :key="stage.id ?? `new-${index}`"
      >
        <PlanDropPlaceholder
          v-if="listDrag.dropIndex.value === index"
          as="li"
          class="p-0!"
          :name="draggedName"
          @dragover="listDrag.overPlaceholder"
          @drop.prevent="listDrag.drop"
        />
        <li
          data-stage-row
          :class="[
            'flex flex-wrap items-start gap-2 rounded-control border border-line bg-surface p-2',
            hasWindows ? '' : 'sm:flex-nowrap',
            listDrag.draggedIndex.value === index ? 'opacity-40' : '',
          ]"
          @dragover="listDrag.over($event, index)"
          @drop.prevent="listDrag.drop"
        >
          <button
            type="button"
            draggable="true"
            class="mt-1 flex h-8 w-5 shrink-0 cursor-grab items-center justify-center rounded text-content-muted hover:bg-neutral-soft hover:text-content focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
            :aria-label="t('plan.stages.dragStage', { name: nameOf(stage.name) || index + 1 })"
            :title="t('plan.stages.dragStage', { name: nameOf(stage.name) || index + 1 })"
            @dragstart="listDrag.start($event, index, ($event.currentTarget as HTMLElement).closest('[data-stage-row]'))"
            @dragend="listDrag.reset"
            @keydown.up.prevent="index > 0 && moveStage(index, -1)"
            @keydown.down.prevent="index < draft.length - 1 && moveStage(index, 1)"
          >
            <AppIcon
              name="grip"
              :size="14"
            />
          </button>
          <span
            aria-hidden="true"
            class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :style="{ backgroundColor: stage.color, color: readableTextColor(stage.color) }"
            >{{ index + 1 }}</span
          >
          <AppLocalizedField
            v-model="stage.name"
            class="min-w-48 flex-1"
            :label="t('plan.stages.nameNumbered', { number: index + 1 })"
            is-label-hidden
            :max-length="60"
            is-required
            :error-for="(locale) => form.error(`stages.${index}.name.${locale}`)"
            @blur="(locale) => form.touch(`stages.${index}.name.${locale}`)"
          />
          <span class="flex shrink-0 items-center gap-1.5">
            <AppColorPicker
              v-model="stage.color"
              :label="t('plan.stages.colorNamed', { number: index + 1 })"
            />
            <AppBadge
              v-if="stage.id && taskCount(stage.id)"
              tone="info"
              class="whitespace-nowrap"
              >{{ t('plan.stages.taskCount', taskCount(stage.id)) }}</AppBadge
            >
            <AppButton
              variant="danger"
              :is-disabled="draft.length === 1"
              :aria-label="t('plan.stages.removeNamed', { name: nameOf(stage.name) || index + 1 })"
              @click="removeStage(index)"
            >
              <AppIcon
                name="trash"
                :size="16"
              />
            </AppButton>
          </span>
          <!-- The agreed window of the whole stage and who answers for it; optional. -->
          <div
            v-if="hasWindows"
            class="flex basis-full flex-wrap items-end gap-2 pl-15"
          >
            <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
              {{ t('plan.stages.windowStart') }}
              <input
                v-model="stage.startDate"
                type="date"
                class="min-h-9 rounded-control border border-line-strong bg-surface px-2 text-sm font-normal text-content"
                @change="stage.startDate ||= null"
              />
            </label>
            <label class="flex flex-col gap-1 text-xs font-semibold text-content-muted">
              {{ t('plan.stages.windowEnd') }}
              <input
                v-model="stage.endDate"
                type="date"
                :min="stage.startDate ?? undefined"
                class="min-h-9 rounded-control border border-line-strong bg-surface px-2 text-sm font-normal text-content"
                @change="stage.endDate ||= null"
              />
            </label>
            <label class="flex w-36 flex-col gap-1 text-xs font-semibold text-content-muted">
              {{ t('plan.stages.owner') }}
              <input
                v-model="stage.owner"
                type="text"
                maxlength="30"
                :placeholder="t('plan.stages.ownerPlaceholder')"
                class="min-h-9 rounded-control border border-line-strong bg-surface px-2 text-sm font-normal text-content"
              />
            </label>
            <p
              v-if="form.error(`stages.${index}.endDate`)"
              class="basis-full text-xs text-danger"
            >
              {{ form.error(`stages.${index}.endDate`) }}
            </p>
          </div>
        </li>
      </template>
      <PlanDropPlaceholder
        v-if="listDrag.dropIndex.value === draft.length"
        as="li"
        class="p-0!"
        :name="draggedName"
        @dragover="listDrag.overPlaceholder"
        @drop.prevent="listDrag.drop"
      />
    </ol>

    <AppButton
      variant="secondary"
      class="self-start"
      :is-disabled="draft.length >= MAX_STAGES"
      @click="addStage"
    >
      <span class="inline-flex items-center gap-1.5"><AppIcon name="plus" />{{ t('plan.stages.add') }}</span>
    </AppButton>

    <div
      v-if="removedWithTasks.length"
      role="status"
      class="flex flex-col gap-1 rounded-control border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      <p class="font-semibold">{{ t('plan.stages.pendingDeletion', removedTaskTotal) }}</p>
      <p>{{ removedWithTasks.map((stage) => `${stage.name} (${t('plan.stages.taskCount', stage.count)})`).join(', ') }}</p>
    </div>
    <p
      v-else-if="removeWarning"
      class="text-xs text-content-muted"
    >
      {{ removeWarning }}
    </p>

    <p
      v-if="error"
      role="alert"
      class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>

    <div class="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
      <AppButton
        variant="secondary"
        :is-disabled="!isDirty || isSaving"
        @click="reset"
      >
        <span class="inline-flex items-center gap-1.5"
          ><AppIcon
            name="undo"
            :size="16"
          />{{ t('common.unsaved.discard') }}</span
        >
      </AppButton>
      <AppButton
        type="submit"
        :is-disabled="!isDirty || isSaving"
        >{{ isSaving ? t('common.actions.saving') : t('common.actions.save') }}</AppButton
      >
    </div>
  </form>
</template>

<script setup lang="ts">
import { z } from 'zod';
import PlanDropPlaceholder from '@/components/plan/PlanDropPlaceholder.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppColorPicker from '@/components/ui/AppColorPicker.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';
import { readableTextColor } from '@/utils/plan-dates';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { PlanStage, PlanStagePayload } from '~~/shared/contracts/plan';

const MAX_STAGES = 20;
const NEW_STAGE_COLOR = '#535b68';

const schema = z.object({
  stages: z
    .array(
      z
        .object({
          name: formRules.localized(60, true),
          color: z.string().regex(/^#[0-9a-f]{6}$/i, { message: 'invalid' }),
          startDate: z.string().nullable().optional(),
          endDate: z.string().nullable().optional(),
        })
        .refine((stage) => !stage.startDate || !stage.endDate || stage.endDate >= stage.startDate, { path: ['endDate'], message: 'endBeforeStart' }),
    )
    .min(1),
});

const props = withDefaults(
  defineProps<{
    stages: PlanStage[];
    formId: string;
    /** Tasks already planned in each stage (by stage id), so removing one says what it costs. */
    taskCounts?: Record<string, number>;
    /** Shown under the list when nothing with data is about to be removed. */
    removeWarning?: string;
    isSaving?: boolean;
    error?: string;
    /** A project's own stages can carry an agreed window and an owner; the system template cannot. */
    hasWindows?: boolean;
  }>(),
  { taskCounts: () => ({}), removeWarning: undefined, isSaving: false, error: undefined, hasWindows: false },
);

const emit = defineEmits<{ save: [stages: PlanStagePayload[]]; 'update:isDirty': [isDirty: boolean] }>();

const { t } = useI18n();
const { contentLanguage } = useContentLanguage();
const confirm = useConfirm();
const draft = ref<PlanStagePayload[]>([]);
const form = useFormValidation(schema, () => ({ stages: draft.value }));

const saved = computed<PlanStagePayload[]>(() =>
  props.stages.map((stage) => ({
    id: stage.id,
    name: { ...stage.name },
    color: stage.color,
    ...(props.hasWindows ? { startDate: stage.startDate, endDate: stage.endDate, owner: stage.owner } : {}),
  })),
);
const isDirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(saved.value));

// Stages removed from the list that still hold tasks: their tasks go when the list is saved.
const removedWithTasks = computed(() => {
  const keptIds = new Set(draft.value.map((stage) => stage.id));

  return props.stages
    .filter((stage) => !keptIds.has(stage.id) && taskCount(stage.id) > 0)
    .map((stage) => ({ name: nameOf(stage.name), count: taskCount(stage.id) }));
});
const removedTaskTotal = computed(() => removedWithTasks.value.reduce((total, stage) => total + stage.count, 0));

watch(isDirty, (value) => emit('update:isDirty', value), { immediate: true });
watch(saved, () => reset(), { immediate: true });

function nameOf(name: LocalizedText): string {
  return resolveLocalizedText(name, contentLanguage.value.primary).value;
}

function taskCount(stageId: string): number {
  return props.taskCounts[stageId] ?? 0;
}

function reset(): void {
  draft.value = saved.value.map((stage) => ({ ...stage, name: { ...stage.name } }));
  form.reset();
}

function addStage(): void {
  draft.value.push({ id: null, name: { vi: null }, color: NEW_STAGE_COLOR, ...(props.hasWindows ? { startDate: null, endDate: null, owner: null } : {}) });
}

function moveStage(index: number, step: number): void {
  moveStageTo(index, index + step);
}

function moveStageTo(from: number, to: number): void {
  const [stage] = draft.value.splice(from, 1);

  if (stage) {
    draft.value.splice(to, 0, stage);
  }
}

const listDrag = useListDrag(moveStageTo);
const draggedName = computed(() => {
  const stage = listDrag.draggedIndex.value === null ? undefined : draft.value[listDrag.draggedIndex.value];

  return stage ? nameOf(stage.name) : null;
});

// Removing a stage that already has tasks asks first and says how many tasks it holds.
async function removeStage(index: number): Promise<void> {
  const stage = draft.value[index];
  const count = stage?.id ? taskCount(stage.id) : 0;

  if (
    count > 0 &&
    !(await confirm(t('plan.stages.removeConfirm', { name: stage ? nameOf(stage.name) : '' }), {
      description: t('plan.stages.removeImpact', count),
      confirmLabel: t('plan.stages.remove'),
      tone: 'danger',
    }))
  ) {
    return;
  }

  draft.value.splice(index, 1);
}

function handleSubmit(): void {
  if (form.validate()) {
    emit(
      'save',
      draft.value.map((stage) => ({
        ...stage,
        name: Object.fromEntries(Object.entries(stage.name).map(([code, text]) => [code, text?.trim() || null])) as LocalizedText,
        ...(props.hasWindows ? { owner: stage.owner?.trim() || null } : {}),
      })),
    );
  }
}

defineExpose({ reset });
</script>
