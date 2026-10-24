<template>
  <aside
    :aria-label="t('plan.panel.label')"
    class="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card"
  >
    <template v-if="item">
      <header
        class="-mx-4 -mt-4 flex flex-col gap-2.5 rounded-t-card px-4 pt-3.5 pb-3.5"
        :style="{ backgroundColor: KIND_TINTS[item.kind] }"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex min-w-0 flex-col gap-1.5">
            <span class="flex flex-wrap items-center gap-1.5 text-xs text-content-muted">
              <AppBadge :tone="KIND_TONES[item.kind]">{{ t(`plan.kind.${item.kind}`) }}</AppBadge>
              <template
                v-for="(ancestor, index) in path"
                :key="index"
              >
                <AppIcon
                  name="chevronRight"
                  :size="12"
                />
                <span class="max-w-40 truncate">{{ resolveLocalizedText(ancestor, language).value }}</span>
              </template>
            </span>
            <AppLocalizedText
              :text="item.name"
              as="h2"
              class="text-lg font-bold break-words"
            />
          </div>
          <button
            type="button"
            class="flex size-8 shrink-0 items-center justify-center rounded-control text-content-muted hover:bg-surface hover:text-content focus-visible:outline-2 focus-visible:outline-accent"
            :aria-label="t('plan.panel.close')"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <div
          v-if="item.kind === 'feature'"
          class="flex flex-col gap-1"
        >
          <span class="flex justify-between text-xs font-semibold">
            <span>{{ t('plan.panel.progress', { done: doneCount, total: stages.length }) }}</span>
            <span class="text-content-muted">{{ t('plan.panel.scheduled', { count: scheduledCount, total: stages.length }) }}</span>
          </span>
          <span
            class="h-2 overflow-hidden rounded-full bg-surface"
            role="progressbar"
            :aria-valuenow="doneCount"
            :aria-valuemin="0"
            :aria-valuemax="stages.length"
            :aria-label="t('plan.panel.progress', { done: doneCount, total: stages.length })"
          >
            <span
              class="block h-full rounded-full bg-success-mark transition-[width]"
              :style="{ width: `${stages.length ? (doneCount / stages.length) * 100 : 0}%` }"
            />
          </span>
        </div>

        <form
          v-if="isRenaming"
          class="flex flex-col gap-3 rounded-control bg-surface p-3"
          @submit.prevent="handleRename"
        >
          <AppLocalizedField
            v-model="nameDraft"
            :label="t('plan.panel.name')"
            :max-length="160"
            is-required
          />
          <div class="flex gap-2">
            <AppButton type="submit">{{ t('common.actions.save') }}</AppButton>
            <AppButton
              variant="secondary"
              @click="isRenaming = false"
              >{{ t('common.actions.cancel') }}</AppButton
            >
          </div>
        </form>
      </header>

      <!-- A click on one stage's bar or cell opens just that stage, ready to edit. -->
      <section
        v-if="focusStage && item.kind === 'feature'"
        class="flex flex-col gap-3"
      >
        <p class="text-xs font-semibold tracking-wide text-content-muted uppercase">{{ t('plan.panel.stageFocus') }}</p>
        <ul class="flex flex-col gap-1.5">
          <PlanTaskEditor
            :key="`${item.id}-${focusStage.id}-focus`"
            :stage="focusStage"
            :stage-name="resolveLocalizedText(focusStage.name, language).value"
            :task="taskByStage.get(focusStage.id) ?? null"
            :members="members"
            :can-edit="canEdit"
            :suggested-dates="suggestDates(stages.findIndex((stage) => stage.id === focusStage?.id))"
            starts-editing
            @save="emit('saveTask', focusStage.id, $event)"
            @remove="emit('removeTask', focusStage.id)"
          />
        </ul>
        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          @click="emit('showAll')"
        >
          {{ t('plan.panel.showAll') }}
          <AppIcon
            name="arrowRight"
            :size="16"
          />
        </button>
      </section>
      <template v-else>
        <PlanPanelSection
          v-if="item.kind === 'feature'"
          :number="1"
          :title="t('plan.panel.schedule')"
          :hint="t('plan.panel.scheduleHint')"
        >
          <ul class="flex flex-col gap-1.5">
            <PlanTaskEditor
              v-for="(stage, index) in stages"
              :key="`${item.id}-${stage.id}`"
              :stage="stage"
              :stage-name="resolveLocalizedText(stage.name, language).value"
              :task="taskByStage.get(stage.id) ?? null"
              :members="members"
              :can-edit="canEdit"
              :suggested-dates="suggestDates(index)"
              @save="emit('saveTask', stage.id, $event)"
              @remove="emit('removeTask', stage.id)"
            />
          </ul>
        </PlanPanelSection>

        <PlanPanelSection
          v-if="item.kind === 'feature'"
          :number="2"
          :title="t('plan.panel.screens')"
          :hint="t('plan.panel.screensHint')"
        >
          <ul
            v-if="linkedScreens.length"
            class="flex flex-col gap-1.5"
          >
            <li
              v-for="screen in linkedScreens"
              :key="screen.code"
            >
              <NuxtLink
                :to="localePath(`/p/${projectCode}/${screen.code}`)"
                class="flex items-center gap-2 rounded-control bg-surface px-3 py-2 text-sm hover:text-accent-strong hover:shadow-card focus-visible:outline-2 focus-visible:outline-accent"
              >
                <AppIcon
                  name="image"
                  :size="16"
                  class="text-content-muted"
                />
                <span class="font-mono text-xs text-content-muted">{{ screen.code }}</span>
                <span class="min-w-0 flex-1 break-words">{{ resolveLocalizedText(screen.name, language).value }}</span>
                <AppIcon
                  name="arrowRight"
                  :size="14"
                />
              </NuxtLink>
            </li>
          </ul>
          <p
            v-else
            class="text-sm text-content-muted"
          >
            {{ t('plan.panel.noScreens') }}
          </p>
          <details
            v-if="canEdit && screens.length"
            class="rounded-control bg-surface"
          >
            <summary class="flex min-h-9 items-center gap-1.5 px-3 text-sm font-semibold text-accent-strong">
              <AppIcon
                name="pencil"
                :size="14"
              />
              {{ t('plan.panel.chooseScreens') }}
            </summary>
            <form
              class="flex flex-col gap-2 px-3 pb-3"
              @submit.prevent="emit('linkScreens', [...screenDraft])"
            >
              <label
                v-for="screen in screens"
                :key="screen.code"
                :class="[
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 text-sm',
                  screenDraft.includes(screen.code) ? 'bg-accent-soft' : 'hover:bg-surface-muted',
                ]"
              >
                <AppCheckbox
                  :model-value="screenDraft.includes(screen.code)"
                  @update:model-value="toggleScreen(screen.code, $event)"
                />
                <span class="font-mono text-xs text-content-muted">{{ screen.code }}</span>
                <span class="min-w-0 break-words">{{ resolveLocalizedText(screen.name, language).value }}</span>
              </label>
              <AppButton type="submit">{{ t('common.actions.save') }}</AppButton>
            </form>
          </details>
        </PlanPanelSection>

        <PlanPanelSection
          v-if="item.kind === 'feature'"
          :number="3"
          :title="t('plan.note.title')"
          :hint="t('plan.note.hint')"
        >
          <form
            v-if="canEdit"
            class="flex flex-col gap-2"
            @submit.prevent="handleSaveNote"
          >
            <label
              class="sr-only"
              :for="noteId"
              >{{ t('plan.note.title') }}</label
            >
            <textarea
              :id="noteId"
              v-model="noteDraft"
              rows="4"
              :maxlength="NOTE_MAX_LENGTH"
              :placeholder="t('plan.note.placeholder')"
              class="w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs text-content-muted tabular-nums">{{ noteDraft.length }} / {{ NOTE_MAX_LENGTH }}</span>
              <span class="flex gap-2">
                <AppButton
                  variant="secondary"
                  :is-disabled="!isNoteDirty"
                  @click="noteDraft = item.note ?? ''"
                  >{{ t('common.unsaved.discard') }}</AppButton
                >
                <AppButton
                  type="submit"
                  :is-disabled="!isNoteDirty"
                  >{{ t('plan.note.save') }}</AppButton
                >
              </span>
            </div>
          </form>
          <p
            v-else-if="item.note"
            class="text-sm whitespace-pre-line"
          >
            {{ item.note }}
          </p>
          <p
            v-else
            class="text-sm text-content-muted"
          >
            {{ t('plan.note.empty') }}
          </p>
        </PlanPanelSection>

        <PlanPanelSection
          v-if="canEdit && childKind"
          :number="1"
          :title="t(`plan.panel.add.${childKind}`)"
          :hint="t(`plan.panel.addHint.${childKind}`)"
        >
          <form
            class="flex flex-col gap-3"
            @submit.prevent="handleAddChild"
          >
            <AppLocalizedField
              v-model="childName"
              :label="t('plan.panel.name')"
              :max-length="160"
              is-required
            />
            <AppButton
              type="submit"
              :is-disabled="!childName.vi?.trim()"
            >
              <span class="inline-flex items-center gap-1.5"><AppIcon name="plus" />{{ t('plan.panel.addSubmit') }}</span>
            </AppButton>
          </form>
        </PlanPanelSection>

        <section
          v-if="canEdit"
          class="flex flex-col gap-2 pt-1"
        >
          <h3 class="text-xs font-semibold tracking-wide text-content-muted uppercase">{{ t('plan.panel.manage') }}</h3>
          <div class="flex flex-wrap gap-2">
            <AppButton
              variant="secondary"
              @click="startRename"
            >
              <span class="inline-flex items-center gap-1.5"
                ><AppIcon
                  name="pencil"
                  :size="16"
                />{{ t('plan.panel.rename') }}</span
              >
            </AppButton>
            <AppButton
              variant="danger"
              :aria-label="t('plan.panel.moveUp')"
              @click="emit('move', 'up')"
              >↑ {{ t('plan.panel.up') }}</AppButton
            >
            <AppButton
              variant="secondary"
              :aria-label="t('plan.panel.moveDown')"
              @click="emit('move', 'down')"
              >↓ {{ t('plan.panel.down') }}</AppButton
            >
            <button
              type="button"
              class="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-control bg-danger-soft px-3 text-sm font-semibold text-danger hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              @click="handleRemove"
            >
              <AppIcon
                name="trash"
                :size="16"
              />
              {{ t('plan.panel.delete') }}
            </button>
          </div>
        </section>
      </template>
    </template>
    <template v-else>
      <div class="flex items-start gap-3 rounded-control bg-info-soft px-4 py-3 text-sm">
        <AppIcon
          name="info"
          class="mt-0.5 shrink-0 text-info"
        />
        <div class="flex flex-col gap-1">
          <h2 class="font-semibold text-info">{{ t('plan.panel.emptyTitle') }}</h2>
          <p class="text-content">{{ t(canEdit ? 'plan.panel.emptyTextEditable' : 'plan.panel.emptyText') }}</p>
        </div>
      </div>
      <PlanPanelSection
        v-if="canEdit"
        :number="1"
        :title="t('plan.panel.add.phase')"
        :hint="t('plan.panel.addHint.phase')"
      >
        <form
          class="flex flex-col gap-3"
          @submit.prevent="handleAddChild"
        >
          <AppLocalizedField
            v-model="childName"
            :label="t('plan.panel.name')"
            :max-length="160"
            is-required
          />
          <AppButton
            type="submit"
            :is-disabled="!childName.vi?.trim()"
          >
            <span class="inline-flex items-center gap-1.5"><AppIcon name="plus" />{{ t('plan.panel.addSubmit') }}</span>
          </AppButton>
        </form>
      </PlanPanelSection>
    </template>
  </aside>
</template>

<script setup lang="ts">
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import PlanPanelSection from '@/components/plan/PlanPanelSection.vue';
import PlanTaskEditor from '@/components/plan/PlanTaskEditor.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { todayDayNumber, toDayNumber, toIsoDate } from '@/utils/plan-dates';
import { emptyLocalizedText } from '@/utils/screen-draft';
import type { ContentLocale, LocalizedText } from '~~/shared/contracts/content';
import type { ProjectMember } from '~~/shared/contracts/member';
import type { PlanItem, PlanItemKind, PlanStage, PlanTask, PlanTaskPayload } from '~~/shared/contracts/plan';
import type { ScreenSummary } from '~~/shared/contracts/screen';

const KIND_TONES = { phase: 'accent', module: 'info', feature: 'success' } as const;
// A light wash of each kind's colour behind the panel header, so the level is clear at a glance.
const KIND_TINTS = {
  phase: 'var(--app-color-accent-soft)',
  module: 'var(--app-color-info-soft)',
  feature: 'var(--app-color-success-soft)',
} as const;
const CHILD_KINDS: Record<PlanItemKind, PlanItemKind | null> = { phase: 'module', module: 'feature', feature: null };
// A newly scheduled stage lasts one working week unless the author changes it.
const DEFAULT_TASK_DAYS = 5;

const props = defineProps<{
  projectCode: string;
  /** Null shows the "how to start" help and the form for a new phase. */
  item: PlanItem | null;
  stages: PlanStage[];
  tasks: PlanTask[];
  members: ProjectMember[];
  screens: ScreenSummary[];
  canEdit: boolean;
  language: ContentLocale;
  /** What deleting the item would also remove. */
  deleteImpact?: { children: number; tasks: number; screens: number };
  /** Names of the phase and module above the item, for "where am I". */
  path?: LocalizedText[];
  /** Shows only this stage of a feature (after a click on its bar or cell); null shows everything. */
  focusStageId?: string | null;
}>();

const emit = defineEmits<{
  /** Leaves the one-stage view for the whole feature. */
  showAll: [];
  close: [];
  rename: [name: LocalizedText];
  move: [direction: 'up' | 'down'];
  remove: [];
  addChild: [kind: PlanItemKind, name: LocalizedText];
  saveTask: [stageId: string, payload: PlanTaskPayload];
  removeTask: [stageId: string];
  linkScreens: [screenCodes: string[]];
  saveNote: [note: string | null];
  /** Whether the note box holds text that is not saved yet. */
  'update:isNoteDirty': [isDirty: boolean];
}>();

const { t } = useI18n();
const focusStage = computed(() => (props.focusStageId ? (props.stages.find((stage) => stage.id === props.focusStageId) ?? null) : null));
const localePath = useLocalePath();
const confirm = useConfirm();

const isRenaming = ref(false);
const nameDraft = ref<LocalizedText>(emptyLocalizedText());
const childName = ref<LocalizedText>(emptyLocalizedText());
const screenDraft = ref<string[]>([]);
const NOTE_MAX_LENGTH = 2_000;
const noteId = useId();
const noteDraft = ref('');
const isNoteDirty = computed(() => noteDraft.value.trim() !== (props.item?.note ?? '').trim());

// A saved note (or another item) resets the box; unsaved typing in the same item is kept.
watch(
  () => [props.item?.id, props.item?.note],
  () => (noteDraft.value = props.item?.note ?? ''),
  { immediate: true },
);
watch(isNoteDirty, (value) => emit('update:isNoteDirty', value), { immediate: true });

function handleSaveNote(): void {
  emit('saveNote', noteDraft.value.trim() || null);
}

const childKind = computed(() => (props.item ? CHILD_KINDS[props.item.kind] : 'phase'));
const taskByStage = computed(() => new Map(props.tasks.filter((task) => task.itemId === props.item?.id).map((task) => [task.stageId, task])));
const doneCount = computed(() => [...taskByStage.value.values()].filter((task) => task.status === 'done').length);
const scheduledCount = computed(() => taskByStage.value.size);
const linkedScreens = computed(() => props.screens.filter((screen) => props.item?.screenCodes.includes(screen.code)));

watch(
  () => props.item?.id,
  () => {
    isRenaming.value = false;
    childName.value = emptyLocalizedText();
    screenDraft.value = [...(props.item?.screenCodes ?? [])];
  },
  { immediate: true },
);

// Stages usually follow each other, so a new one starts the day after the closest earlier stage ends.
function suggestDates(stageIndex: number): { startDate: string; endDate: string } {
  const previous = props.stages
    .slice(0, stageIndex)
    .map((stage) => taskByStage.value.get(stage.id))
    .filter((task): task is PlanTask => Boolean(task))
    .at(-1);
  const start = previous ? toDayNumber(previous.endDate) + 1 : todayDayNumber();

  return { startDate: toIsoDate(start), endDate: toIsoDate(start + DEFAULT_TASK_DAYS - 1) };
}

function toggleScreen(code: string, isChecked: boolean): void {
  screenDraft.value = isChecked ? [...screenDraft.value, code] : screenDraft.value.filter((linked) => linked !== code);
}

function startRename(): void {
  nameDraft.value = { ...(props.item?.name ?? emptyLocalizedText()) };
  isRenaming.value = true;
}

function handleRename(): void {
  emit('rename', nameDraft.value);
  isRenaming.value = false;
}

// Deleting asks first and says what goes with it (items below, their schedules, screen links).
async function handleRemove(): Promise<void> {
  if (!props.item) {
    return;
  }

  const impact = props.deleteImpact ?? { children: 0, tasks: 0, screens: 0 };
  const parts = [
    impact.children ? t('plan.panel.impact.children', impact.children) : '',
    impact.tasks ? t('plan.panel.impact.tasks', impact.tasks) : '',
    impact.screens ? t('plan.panel.impact.screens', impact.screens) : '',
  ].filter(Boolean);

  if (
    await confirm(t(props.item.kind === 'feature' ? 'plan.panel.deleteConfirm' : 'plan.panel.deleteGroupConfirm'), {
      description: parts.length ? t('plan.panel.impact.summary', { parts: parts.join(', ') }) : t('plan.panel.impact.none'),
      confirmLabel: t('plan.panel.delete'),
      tone: 'danger',
    })
  ) {
    emit('remove');
  }
}

function handleAddChild(): void {
  if (childKind.value) {
    emit('addChild', childKind.value, childName.value);
    childName.value = emptyLocalizedText();
  }
}
</script>
