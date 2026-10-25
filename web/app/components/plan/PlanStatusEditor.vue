<template>
  <form
    :id="formId"
    novalidate
    class="flex flex-col gap-4"
    @submit.prevent="handleSubmit"
  >
    <p class="text-sm text-content-muted">{{ t('plan.statuses.hint') }}</p>

    <ol class="flex flex-col gap-2">
      <template
        v-for="(status, index) in draft"
        :key="status.id ?? `new-${index}`"
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
          data-status-row
          :class="[
            'flex flex-wrap items-start gap-2 rounded-control border border-line bg-surface p-2 sm:flex-nowrap',
            listDrag.draggedIndex.value === index ? 'opacity-40' : '',
          ]"
          @dragover="listDrag.over($event, index)"
          @drop.prevent="listDrag.drop"
        >
          <button
            type="button"
            draggable="true"
            class="mt-1 flex h-8 w-5 shrink-0 cursor-grab items-center justify-center rounded text-content-muted hover:bg-neutral-soft hover:text-content focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
            :aria-label="t('plan.statuses.drag', { name: nameOf(status.name) || index + 1 })"
            :title="t('plan.statuses.drag', { name: nameOf(status.name) || index + 1 })"
            @dragstart="listDrag.start($event, index, ($event.currentTarget as HTMLElement).closest('[data-status-row]'))"
            @dragend="listDrag.reset"
            @keydown.up.prevent="index > 0 && moveTo(index, index - 1)"
            @keydown.down.prevent="index < draft.length - 1 && moveTo(index, index + 1)"
          >
            <AppIcon
              name="grip"
              :size="14"
            />
          </button>
          <AppLocalizedField
            v-model="status.name"
            class="min-w-40 flex-1"
            :label="t('plan.statuses.nameNumbered', { number: index + 1 })"
            is-label-hidden
            :max-length="40"
            is-required
            :error-for="(locale) => form.error(`statuses.${index}.name.${locale}`)"
            @blur="(locale) => form.touch(`statuses.${index}.name.${locale}`)"
          />
          <span class="flex shrink-0 items-center gap-1.5">
            <AppSelect
              v-model="status.category"
              class="w-36"
              :aria-label="t('plan.statuses.categoryNamed', { number: index + 1 })"
              :options="CATEGORIES.map((category) => ({ value: category, label: t(`plan.status.${category}`) }))"
            />
            <AppColorPicker
              v-model="status.color"
              :label="t('plan.statuses.colorNamed', { number: index + 1 })"
            />
            <AppBadge
              v-if="status.id && taskCount(status.id)"
              tone="info"
              class="whitespace-nowrap"
              >{{ t('plan.stages.taskCount', taskCount(status.id)) }}</AppBadge
            >
            <AppButton
              variant="danger"
              :is-disabled="isLastOfCategory(index)"
              :title="isLastOfCategory(index) ? t('plan.statuses.keepOne') : undefined"
              :aria-label="t('plan.statuses.removeNamed', { name: nameOf(status.name) || index + 1 })"
              @click="remove(index)"
            >
              <AppIcon
                name="trash"
                :size="16"
              />
            </AppButton>
          </span>
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
      :is-disabled="draft.length >= MAX_STATUSES"
      @click="add"
    >
      <span class="inline-flex items-center gap-1.5"><AppIcon name="plus" />{{ t('plan.statuses.add') }}</span>
    </AppButton>

    <p
      v-if="missingCategories.length"
      role="alert"
      class="text-sm text-danger"
    >
      {{ t('plan.statuses.missing', { categories: missingCategories.map((category) => t(`plan.status.${category}`)).join(', ') }) }}
    </p>
    <p
      v-else
      class="text-xs text-content-muted"
    >
      {{ t('plan.statuses.removeNote') }}
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
        :is-disabled="!isDirty || isSaving || missingCategories.length > 0"
        >{{ isSaving ? t('common.actions.saving') : t('common.actions.save') }}</AppButton
      >
    </div>
  </form>
</template>

<script setup lang="ts">
import { z } from 'zod';
import PlanDropPlaceholder from '@/components/plan/PlanDropPlaceholder.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppColorPicker from '@/components/ui/AppColorPicker.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { PlanStatus, PlanStatusPayload, PlanTaskStatus } from '~~/shared/contracts/plan';

const MAX_STATUSES = 20;
const CATEGORIES: PlanTaskStatus[] = ['todo', 'doing', 'done'];
const NEW_STATUS_COLOR = '#64748b';

const schema = z.object({ statuses: z.array(z.object({ name: formRules.localized(40, true) })).min(3) });

const props = withDefaults(
  defineProps<{
    statuses: PlanStatus[];
    formId: string;
    /** Tasks showing each status (by status id). */
    taskCounts?: Record<string, number>;
    isSaving?: boolean;
  }>(),
  { taskCounts: () => ({}), isSaving: false },
);

const emit = defineEmits<{ save: [statuses: PlanStatusPayload[]]; 'update:isDirty': [isDirty: boolean] }>();

const { t } = useI18n();
const { contentLanguage } = useContentLanguage();
const draft = ref<PlanStatusPayload[]>([]);
const form = useFormValidation(schema, () => ({ statuses: draft.value }));

const saved = computed<PlanStatusPayload[]>(() =>
  props.statuses.map((status) => ({ id: status.id, name: { ...status.name }, category: status.category, color: status.color })),
);
const isDirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(saved.value));
// Every category keeps a status, so any task can be shown and the chart's quick menu always has a choice.
const missingCategories = computed(() => CATEGORIES.filter((category) => !draft.value.some((status) => status.category === category)));

watch(isDirty, (value) => emit('update:isDirty', value), { immediate: true });
watch(saved, () => reset(), { immediate: true });

function nameOf(name: LocalizedText): string {
  return resolveLocalizedText(name, contentLanguage.value.primary).value;
}

function taskCount(statusId: string): number {
  return props.taskCounts[statusId] ?? 0;
}

function isLastOfCategory(index: number): boolean {
  const category = draft.value[index]?.category;

  return draft.value.filter((status) => status.category === category).length <= 1;
}

function reset(): void {
  draft.value = saved.value.map((status) => ({ ...status, name: { ...status.name } }));
  form.reset();
}

function add(): void {
  draft.value.push({ id: null, name: { vi: null }, category: 'doing', color: NEW_STATUS_COLOR });
}

function remove(index: number): void {
  draft.value.splice(index, 1);
}

function moveTo(from: number, to: number): void {
  const [status] = draft.value.splice(from, 1);

  if (status) {
    draft.value.splice(to, 0, status);
  }
}

const listDrag = useListDrag(moveTo);
const draggedName = computed(() => {
  const status = listDrag.draggedIndex.value === null ? undefined : draft.value[listDrag.draggedIndex.value];

  return status ? nameOf(status.name) : null;
});

function handleSubmit(): void {
  if (form.validate() && !missingCategories.value.length) {
    emit(
      'save',
      draft.value.map((status) => ({
        ...status,
        name: Object.fromEntries(Object.entries(status.name).map(([code, text]) => [code, text?.trim() || null])) as LocalizedText,
      })),
    );
  }
}

defineExpose({ reset });
</script>
