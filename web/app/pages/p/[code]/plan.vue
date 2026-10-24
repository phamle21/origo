<template>
  <AppTopbar
    :crumbs="[
      { label: t('project.list.title'), to: localePath('/projects') },
      { label: projectName, to: localePath(`/p/${code}`) },
      { label: t('plan.title') },
    ]"
  />
  <ProjectNav
    :project-code="code"
    current="plan"
  />

  <div class="flex w-full flex-col gap-5 px-4 py-6 sm:px-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex max-w-3xl min-w-0 flex-col gap-2">
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <AppTileIcon name="plan" />
          {{ t('plan.title') }}
        </h1>
        <p class="text-content-muted">{{ t(plan?.canEdit ? 'plan.descriptionEditable' : 'plan.description') }}</p>
      </div>
      <ul
        v-if="plan"
        :aria-label="t('plan.stages.legend')"
        class="flex flex-wrap gap-x-4 gap-y-1"
      >
        <li
          v-for="stage in plan.stages"
          :key="stage.id"
          class="flex items-center gap-1.5 text-xs font-medium"
        >
          <span
            aria-hidden="true"
            class="size-3 rounded-sm"
            :style="{ backgroundColor: stage.color }"
          />
          {{ resolveLocalizedText(stage.name, contentLanguage.primary).value }}
        </li>
      </ul>
    </div>

    <p
      v-if="editor.errorMessage.value"
      role="alert"
      class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ editor.errorMessage.value }}
    </p>

    <AppPageSkeleton
      v-if="isPending && !plan"
      variant="plan"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <div
      v-else-if="plan"
      class="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]"
    >
      <div
        ref="planView"
        :class="['flex min-w-0 flex-col gap-3', isFullscreen ? 'h-dvh bg-canvas p-4 text-content' : '']"
      >
        <div class="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-card">
          <h2
            v-if="isFullscreen"
            class="mr-2 text-lg font-bold"
          >
            {{ projectName }} · {{ t('plan.title') }}
          </h2>
          <div
            v-if="plan.items.length"
            class="flex flex-wrap items-center gap-2"
          >
            <div
              role="group"
              :aria-label="t('plan.view.label')"
              class="flex rounded-control border border-line-strong bg-surface p-0.5"
            >
              <button
                v-for="option in VIEWS"
                :key="option"
                type="button"
                :aria-pressed="view === option"
                :class="[
                  'min-h-8 rounded-[0.5rem] px-3 text-sm font-semibold',
                  view === option ? 'bg-accent text-accent-contrast' : 'text-content-muted hover:text-content',
                ]"
                @click="view = option"
              >
                {{ t(`plan.view.${option}`) }}
              </button>
            </div>
            <label
              v-if="view === 'gantt'"
              class="flex items-center gap-2 text-sm text-content-muted"
            >
              {{ t('plan.zoom.label') }}
              <AppSelect
                v-model="dayWidth"
                size="sm"
                class="min-w-28"
                :options="Object.entries(ZOOM_LEVELS).map(([name, width]) => ({ value: width, label: t(`plan.zoom.${name}`) }))"
              />
            </label>
            <AppButton
              v-if="view === 'gantt' && today !== null"
              variant="secondary"
              @click="gantt?.scrollToToday()"
              >{{ t('plan.gantt.today') }}</AppButton
            >
          </div>
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <PlanGuidePopover v-if="view === 'gantt' && plan.canEdit && plan.items.length" />
            <p
              v-else-if="view === 'gantt' && plan.items.length"
              class="flex items-center gap-1.5 text-xs text-content-muted"
            >
              <AppIcon
                name="lock"
                :size="14"
              />
              {{ myRole ? t('plan.guide.readOnly', { role: nameOf(myRole) }) : t('plan.gantt.readOnlyHint') }}
            </p>
            <button
              v-if="canFullscreen && plan.items.length"
              type="button"
              class="flex size-9 items-center justify-center rounded-control border border-line-strong bg-surface text-content-muted hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              :aria-label="t(isFullscreen ? 'plan.fullscreen.exit' : 'plan.fullscreen.enter')"
              :title="t(isFullscreen ? 'plan.fullscreen.exit' : 'plan.fullscreen.enter')"
              :aria-pressed="isFullscreen"
              @click="toggleFullscreen"
            >
              <AppIcon :name="isFullscreen ? 'minimize' : 'maximize'" />
            </button>
            <button
              v-if="plan.canEdit"
              type="button"
              class="flex size-9 items-center justify-center rounded-control border border-line-strong bg-surface text-content-muted hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              :aria-label="t('plan.stages.open')"
              :title="t('plan.stages.open')"
              @click="isStageDialogOpen = true"
            >
              <AppIcon name="settings" />
            </button>
          </div>
          <PlanFilterBar
            v-if="plan.items.length"
            v-model="filter"
            class="basis-full"
            :stages="plan.stages"
            :members="members ?? []"
            :language="contentLanguage.primary"
            :my-user-id="myUserId"
            :shown-features="featureCount(filtered.items)"
            :total-features="featureCount(plan.items)"
          />
        </div>
        <AppEmptyState
          v-if="!plan.items.length"
          :title="t('plan.empty.title')"
          :description="t(plan.canEdit ? 'plan.empty.textEditable' : 'plan.empty.text')"
        />
        <template v-else>
          <p
            v-if="isFiltering && !rows.length"
            class="rounded-card border border-dashed border-line-strong bg-surface px-5 py-8 text-center text-sm text-content-muted"
          >
            {{ t('plan.filter.empty') }}
            <button
              type="button"
              class="ml-1 font-semibold text-accent-strong hover:underline"
              @click="filter = emptyPlanFilter()"
            >
              {{ t('plan.filter.clear') }}
            </button>
          </p>
          <PlanGantt
            v-if="view === 'gantt' && timeline"
            ref="gantt"
            :rows="rows"
            :stages="plan.stages"
            :timeline="timeline"
            :day-width="dayWidth"
            :today="today"
            :is-filling="isFullscreen"
            :can-edit="plan.canEdit"
            :selected-item-id="selectedItemId"
            :language="contentLanguage.primary"
            @select="selectItem($event)"
            @select-stage="selectStage"
            @toggle="toggleCollapsed"
            @move-task="handleMoveTask"
            :items="plan.items"
            @move-item="handleMoveItem"
            @change-task-status="handleChangeTaskStatus"
            @remove-task="handleRemoveTask"
            @open-note="noteItemId = $event"
            @row-action="handleRowAction"
            @move-item-step="(itemId, move) => editor.run(() => updatePlanItem(code, itemId, { move }))"
          />
          <PlanStageTable
            v-else
            :is-filling="isFullscreen"
            :rows="rows"
            :stages="plan.stages"
            :selected-item-id="selectedItemId"
            :language="contentLanguage.primary"
            @select="selectItem($event)"
            @select-stage="selectStage"
            :items="plan.items"
            :can-edit="plan.canEdit"
            @move-item="handleMoveItem"
            @change-task-status="handleChangeTaskStatus"
            @remove-task="handleRemoveTask"
            @open-note="noteItemId = $event"
            @row-action="handleRowAction"
            @move-item-step="(itemId, move) => editor.run(() => updatePlanItem(code, itemId, { move }))"
          />
        </template>

        <PlanNoteDialog
          :open="Boolean(noteItem)"
          :item-name="noteItem ? resolveLocalizedText(noteItem.name, contentLanguage.primary).value : ''"
          :note="noteItem?.note ?? null"
          :can-edit="plan.canEdit"
          :is-saving="editor.isPending.value"
          @update:open="(isOpen) => !isOpen && (noteItemId = null)"
          @save="handleSaveNote"
        />
        <AppDialog
          v-if="plan.canEdit"
          v-model:open="isStageDialogOpen"
          icon="settings"
          :title="t('plan.stages.title')"
          :is-dirty="isStageDraftDirty"
        >
          <PlanStageEditor
            v-model:is-dirty="isStageDraftDirty"
            form-id="project-stages-form"
            :stages="plan.stages"
            :task-counts="taskCountsByStage"
            :is-saving="editor.isPending.value"
            @save="handleSaveStages"
          />
        </AppDialog>
      </div>

      <PlanItemPanel
        class="xl:sticky xl:top-20"
        :project-code="code"
        :item="selectedItem"
        :delete-impact="selectedImpact"
        :path="selectedPath"
        :stages="plan.stages"
        :tasks="plan.tasks"
        :members="members ?? []"
        :screens="projectScreens?.screens ?? []"
        :can-edit="plan.canEdit"
        :language="contentLanguage.primary"
        :focus-stage-id="selectedStageId"
        @show-all="selectedStageId = null"
        @close="selectedItemId = null"
        @rename="(name) => selectedItemId && editor.run(() => updatePlanItem(code, selectedItemId!, { name }))"
        @move="(move) => selectedItemId && editor.run(() => updatePlanItem(code, selectedItemId!, { move }))"
        @remove="handleRemoveItem"
        @add-child="handleAddItem"
        @save-task="(stageId, task) => selectedItemId && editor.run(() => savePlanTask(code, selectedItemId!, stageId, task))"
        @remove-task="handleRemoveStageOfSelected"
        @save-note="(note) => selectedItemId && editor.run(() => updatePlanItem(code, selectedItemId!, { note }))"
        @update:is-note-dirty="isNoteDirty = $event"
        @link-screens="(screenCodes) => selectedItemId && editor.run(() => linkPlanItemScreens(code, selectedItemId!, screenCodes))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import PlanGantt from '@/components/plan/PlanGantt.vue';
import PlanGuidePopover from '@/components/plan/PlanGuidePopover.vue';
import PlanItemPanel from '@/components/plan/PlanItemPanel.vue';
import PlanNoteDialog from '@/components/plan/PlanNoteDialog.vue';
import PlanStageEditor from '@/components/plan/PlanStageEditor.vue';
import AppDialog from '@/components/ui/AppDialog.vue';
import PlanStageTable from '@/components/plan/PlanStageTable.vue';
import ProjectNav from '@/components/project/ProjectNav.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { createPlanItem, deletePlanItem, deletePlanTask, linkPlanItemScreens, savePlanStages, savePlanTask, updatePlanItem } from '@/api/plan/plan';
import { localizedValues, resolveLocalizedText } from '@/utils/content-language';
import { buildTimeline, todayDayNumber, toIsoDate, type DayRange } from '@/utils/plan-dates';
import { buildPlanRows, taskRange } from '@/utils/plan-tree';
import { emptyPlanFilter, filterPlan, isPlanFilterActive, type PlanFilter } from '@/utils/plan-filter';
import PlanFilterBar from '@/components/plan/PlanFilterBar.vue';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { PlanItem, PlanItemKind, PlanStagePayload, PlanTask } from '~~/shared/contracts/plan';

const VIEWS = ['gantt', 'table'] as const;
const ZOOM_LEVELS = { narrow: 14, normal: 26, wide: 40 } as const;
// Bounds the rendered day columns; a plan longer than this scrolls to its first three years.
const MAX_TIMELINE_DAYS = 1_096;

const { t } = useI18n();
const localePath = useLocalePath();
const { code } = useProjectRoute();
const { contentLanguage } = useContentLanguage();
const { data: projectScreens } = await useProjectScreens(code);
const { data: plan, isPending, hasFailed, errorMessage, refresh } = await useProjectPlan(code);
const { data: members } = await useProjectMembers(code);
const currentUser = useCurrentUser();
const editor = usePlanEditor(refresh);
const confirm = useConfirm();

// Full screen shows only the toolbar and the chart or table, for presenting on a shared screen.
const planView = useTemplateRef<HTMLElement>('planView');
const isFullscreen = ref(false);
const canFullscreen = ref(false);

function syncFullscreen(): void {
  isFullscreen.value = Boolean(planView.value) && document.fullscreenElement === planView.value;
}

async function toggleFullscreen(): Promise<void> {
  if (isFullscreen.value) {
    await document.exitFullscreen().catch(() => undefined);
  } else {
    await planView.value?.requestFullscreen().catch(() => undefined);
  }
}

onMounted(() => {
  canFullscreen.value = document.fullscreenEnabled;
  document.addEventListener('fullscreenchange', syncFullscreen);
});
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', syncFullscreen));

const { nameOf } = useProjectRoles();
const view = ref<(typeof VIEWS)[number]>('gantt');
const dayWidth = ref<number>(ZOOM_LEVELS.normal);
const selectedItemId = ref<string | null>(null);
const collapsedIds = ref(new Set<string>());
// A click on a row shows the whole item; a click on one stage (bar or cell) shows just that stage.
const selectedStageId = ref<string | null>(null);

function selectItem(itemId: string): void {
  selectedItemId.value = itemId;
  selectedStageId.value = null;
}

function selectStage(itemId: string, stageId: string): void {
  selectedItemId.value = itemId;
  selectedStageId.value = stageId;
}
const today = ref<number | null>(null);
const gantt = useTemplateRef<InstanceType<typeof PlanGantt>>('gantt');
const isNoteDirty = ref(false);
const noteItemId = ref<string | null>(null);
const noteItem = computed(() => plan.value?.items.find((item) => item.id === noteItemId.value) ?? null);

async function handleSaveNote(note: string | null): Promise<void> {
  const itemId = noteItemId.value;

  if (itemId && (await editor.run(() => updatePlanItem(code.value, itemId, { note })))) {
    noteItemId.value = null;
  }
}

useUnsavedChanges(isNoteDirty);

const isStageDialogOpen = ref(false);
const isStageDraftDirty = ref(false);

useUnsavedChanges(computed(() => isStageDialogOpen.value && isStageDraftDirty.value));

// Tasks per stage, so the stage settings say what removing a stage would delete.
const taskCountsByStage = computed(() => {
  const counts: Record<string, number> = {};

  for (const task of plan.value?.tasks ?? []) {
    counts[task.stageId] = (counts[task.stageId] ?? 0) + 1;
  }

  return counts;
});

// The phase and module above the selected item, shown in the panel header ("where am I").
const selectedPath = computed(() => {
  const byId = new Map((plan.value?.items ?? []).map((item) => [item.id, item]));
  const path = [];

  for (let parent = byId.get(byId.get(selectedItemId.value ?? '')?.parentId ?? ''); parent; parent = byId.get(parent.parentId ?? '')) {
    path.unshift(parent.name);
  }

  return path;
});

// What deleting an item takes with it: everything below it, their tasks and screen links.
function impactOf(rootId: string | null): { children: number; tasks: number; screens: number } {
  const items = plan.value?.items ?? [];

  if (!rootId) {
    return { children: 0, tasks: 0, screens: 0 };
  }

  const ids = new Set([rootId]);

  for (let grew = true; grew;) {
    grew = false;

    for (const item of items) {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        grew = true;
      }
    }
  }

  return {
    children: ids.size - 1,
    tasks: (plan.value?.tasks ?? []).filter((task) => ids.has(task.itemId)).length,
    screens: items.filter((item) => ids.has(item.id)).reduce((total, item) => total + item.screenCodes.length, 0),
  };
}

const selectedImpact = computed(() => impactOf(selectedItemId.value));

// Row menu actions that need the page: adding a child opens the panel (which holds the form), and
// deleting asks first with the same "what goes with it" summary as the panel.
async function handleRowAction(itemId: string, action: 'addChild' | 'delete'): Promise<void> {
  const item = plan.value?.items.find((candidate) => candidate.id === itemId);

  if (!item) {
    return;
  }
  if (action === 'addChild') {
    selectedItemId.value = itemId;

    return;
  }

  const impact = impactOf(itemId);
  const parts = [
    impact.children ? t('plan.panel.impact.children', impact.children) : '',
    impact.tasks ? t('plan.panel.impact.tasks', impact.tasks) : '',
    impact.screens ? t('plan.panel.impact.screens', impact.screens) : '',
  ].filter(Boolean);
  const isConfirmed = await confirm(t(item.kind === 'feature' ? 'plan.panel.deleteConfirm' : 'plan.panel.deleteGroupConfirm'), {
    description: parts.length ? t('plan.panel.impact.summary', { parts: parts.join(', ') }) : t('plan.panel.impact.none'),
    confirmLabel: t('plan.panel.delete'),
    tone: 'danger',
  });

  if (isConfirmed && (await editor.run(() => deletePlanItem(code.value, itemId))) && selectedItemId.value === itemId) {
    selectedItemId.value = null;
  }
}

async function handleSaveStages(stages: PlanStagePayload[]): Promise<void> {
  if (await editor.run(() => savePlanStages(code.value, stages))) {
    isStageDraftDirty.value = false;
    isStageDialogOpen.value = false;
  }
}

// Dates shown while a moved bar is being saved, so it does not jump back until the reload arrives.
const pendingDates = ref(new Map<string, Pick<PlanTask, 'startDate' | 'endDate'>>());

const projectName = computed(() =>
  projectScreens.value ? resolveLocalizedText(projectScreens.value.project.name, contentLanguage.value.primary).value : code.value,
);
const myRole = computed(() => projectScreens.value?.project.myRole ?? null);
const tasks = computed(() => (plan.value?.tasks ?? []).map((task) => ({ ...task, ...pendingDates.value.get(task.id) })));
// Filters apply to both views. While one is set, every group opens so nothing found stays hidden.
const filter = ref<PlanFilter>(emptyPlanFilter());
const isFiltering = computed(() => isPlanFilterActive(filter.value));
const filtered = computed(() =>
  filterPlan(plan.value?.items ?? [], tasks.value, filter.value, (item) => localizedValues(item.name), toIsoDate(today.value ?? todayDayNumber())),
);
const myUserId = computed(() => members.value?.find((member) => member.user.email === currentUser.value?.email)?.user.id ?? null);
const featureCount = (items: PlanItem[]) => items.filter((item) => item.kind === 'feature').length;
const rows = computed(() => buildPlanRows(filtered.value.items, filtered.value.tasks, isFiltering.value ? new Set() : collapsedIds.value));
const selectedItem = computed(() => plan.value?.items.find((item) => item.id === selectedItemId.value) ?? null);
const timeline = computed<DayRange | null>(() => {
  const range = buildTimeline(tasks.value.map(taskRange), today.value);

  return range ? { start: range.start, end: Math.min(range.end, range.start + MAX_TIMELINE_DAYS - 1) } : null;
});

// Today depends on the reader's clock, so it is only known after hydration.
onMounted(async () => {
  today.value = todayDayNumber();
  await nextTick();
  gantt.value?.scrollToToday();
});

function toggleCollapsed(itemId: string): void {
  const next = new Set(collapsedIds.value);

  if (!next.delete(itemId)) {
    next.add(itemId);
  }
  collapsedIds.value = next;
}

async function handleMoveTask(task: PlanTask, range: DayRange): Promise<void> {
  const dates = { startDate: toIsoDate(range.start), endDate: toIsoDate(range.end) };

  pendingDates.value = new Map(pendingDates.value).set(task.id, dates);
  await editor.run(() => savePlanTask(code.value, task.itemId, task.stageId, { ...dates, status: task.status, assigneeId: task.assigneeId }));

  const next = new Map(pendingDates.value);

  next.delete(task.id);
  pendingDates.value = next;
}

// Right-click status change: same dates and owner, new status.
async function handleChangeTaskStatus(task: PlanTask, status: PlanTask['status']): Promise<void> {
  await editor.run(() =>
    savePlanTask(code.value, task.itemId, task.stageId, { startDate: task.startDate, endDate: task.endDate, status, assigneeId: task.assigneeId }),
  );
}

// Removing one stage's dates (from the bar's right-click menu) asks first; the feature and its
// other stages stay as they are.
async function handleRemoveTask(task: PlanTask): Promise<void> {
  const item = plan.value?.items.find((candidate) => candidate.id === task.itemId);
  const stage = plan.value?.stages.find((candidate) => candidate.id === task.stageId);
  const isConfirmed = await confirm(
    t('plan.statusMenu.removeConfirm', {
      stage: stage ? resolveLocalizedText(stage.name, contentLanguage.value.primary).value : '',
      item: item ? resolveLocalizedText(item.name, contentLanguage.value.primary).value : '',
    }),
    { description: t('plan.statusMenu.removeImpact'), confirmLabel: t('plan.statusMenu.removeStage'), tone: 'danger' },
  );

  // After removing, the feature itself is shown, so the stage that just went away is no longer selected.
  if (isConfirmed && (await editor.run(() => deletePlanTask(code.value, task.itemId, task.stageId)))) {
    selectItem(task.itemId);
  }
}

// "Remove stage" in the details panel asks first, the same way as the right-click menu.
async function handleRemoveStageOfSelected(stageId: string): Promise<void> {
  const task = plan.value?.tasks.find((candidate) => candidate.itemId === selectedItemId.value && candidate.stageId === stageId);

  if (task) {
    await handleRemoveTask(task);
  }
}

// A dropped row opens the group it lands in, so the moved item stays in view.
async function handleMoveItem(itemId: string, target: { parentId: string | null; index: number }): Promise<void> {
  if (target.parentId && collapsedIds.value.has(target.parentId)) {
    const next = new Set(collapsedIds.value);

    next.delete(target.parentId);
    collapsedIds.value = next;
  }
  await editor.run(() => updatePlanItem(code.value, itemId, { parentId: target.parentId, position: target.index }));
}

async function handleAddItem(kind: PlanItemKind, name: LocalizedText): Promise<void> {
  const parentId = kind === 'phase' ? null : selectedItemId.value;

  if (parentId) {
    const next = new Set(collapsedIds.value);

    next.delete(parentId);
    collapsedIds.value = next;
  }
  await editor.run(() => createPlanItem(code.value, kind, parentId, name));
}

async function handleRemoveItem(): Promise<void> {
  const itemId = selectedItemId.value;

  if (itemId && (await editor.run(() => deletePlanItem(code.value, itemId)))) {
    selectedItemId.value = null;
  }
}

useSeoMeta({ title: () => `${t('plan.title')} · ${projectName.value}` });
</script>
