<template>
  <div
    ref="scroller"
    role="region"
    tabindex="0"
    :aria-label="t('plan.gantt.label')"
    :aria-describedby="hintId"
    :class="[
      'overflow-auto rounded-card border border-line bg-surface shadow-card focus-visible:outline-2 focus-visible:outline-accent',
      isFilling ? 'min-h-0 flex-1' : 'max-h-[70vh]',
    ]"
  >
    <p
      :id="hintId"
      class="sr-only"
    >
      {{ t(canEdit ? 'plan.gantt.keyboardHint' : 'plan.gantt.readOnlyHint') }}
    </p>
    <div
      class="relative"
      :style="{ width: `${LABEL_WIDTH + totalWidth}px` }"
    >
      <div class="sticky top-0 z-20 flex border-b border-line-strong bg-toolbar">
        <div
          class="sticky left-0 z-30 flex shrink-0 items-end border-r border-line-strong bg-toolbar px-3 pb-1.5 text-xs font-semibold text-content-muted"
          :style="{ width: `${LABEL_WIDTH}px` }"
        >
          {{ t('plan.gantt.item') }}
        </div>
        <div :style="{ width: `${totalWidth}px` }">
          <div class="relative h-6 border-b border-line">
            <span
              v-for="segment in months"
              :key="segment.key"
              class="absolute top-0 flex h-6 items-center truncate border-l border-line-strong px-1.5 text-xs font-semibold"
              :style="{ left: `${segment.startOffset * dayWidth}px`, width: `${segment.length * dayWidth}px` }"
              >{{ formatMonth(segment.year, segment.month) }}</span
            >
          </div>
          <div class="flex h-6">
            <span
              v-for="day in days"
              :key="day.number"
              :class="[
                'flex shrink-0 items-center justify-center text-[11px] tabular-nums',
                day.isWeekend ? 'bg-neutral-soft text-content-muted' : 'text-content-muted',
                day.number === today ? 'font-bold text-danger' : '',
              ]"
              :style="{ width: `${dayWidth}px` }"
              >{{ day.label }}</span
            >
          </div>
        </div>
      </div>

      <div class="relative">
        <div
          aria-hidden="true"
          class="pointer-events-none absolute top-0 bottom-0"
          :style="{ left: `${LABEL_WIDTH}px`, width: `${totalWidth}px`, backgroundImage: gridLines, backgroundSize: `${dayWidth}px 100%` }"
        >
          <span
            v-for="day in weekendDays"
            :key="day"
            class="absolute top-0 bottom-0 bg-neutral-soft/70"
            :style="{ left: `${(day - timeline.start) * dayWidth}px`, width: `${dayWidth}px` }"
          />
          <span
            v-if="todayOffset !== null"
            class="absolute top-0 bottom-0 z-10 w-0.5 bg-danger"
            :style="{ left: `${todayOffset}px` }"
          />
        </div>

        <template
          v-for="row in layout"
          :key="row.item.id"
        >
          <PlanDropPlaceholder
            v-if="rowDrag.isPlaceholderAt(row.item.id, 'before')"
            class="border-b border-line"
            :name="draggedLabel"
            @dragover="rowDrag.overPlaceholder"
            @drop.prevent="rowDrag.drop"
          />
          <div
            :class="['relative flex border-b border-line', rowBackground(row, false), rowDrag.draggedId.value === row.item.id ? 'opacity-40' : '']"
            @contextmenu="menus?.openRowMenu($event, row.item)"
            @dragover="rowDrag.over($event, row.item.id)"
            @drop.prevent="rowDrag.drop"
          >
            <div
              data-row-label
              :class="[
                'group sticky left-0 z-10 flex shrink-0 items-center gap-1 border-r border-line-strong py-1 pr-2',
                rowBackground(row, true),
                rowDrag.dropTarget.value?.rowId === row.item.id && rowDrag.dropTarget.value.mode === 'inside' ? 'ring-2 ring-accent ring-inset' : '',
              ]"
              :style="{ width: `${LABEL_WIDTH}px`, paddingLeft: `${(canEdit ? 2 : 8) + row.depth * 16}px` }"
            >
              <button
                v-if="canEdit"
                type="button"
                draggable="true"
                class="flex h-7 w-4 shrink-0 cursor-grab items-center justify-center rounded text-content-muted hover:bg-neutral-soft hover:text-content focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
                :aria-label="t('plan.gantt.dragRow', { name: nameOf(row.item) })"
                :title="t('plan.gantt.dragRow', { name: nameOf(row.item) })"
                @dragstart="rowDrag.start($event, row.item.id, ($event.currentTarget as HTMLElement).closest('[data-row-label]'))"
                @dragend="rowDrag.reset"
                @keydown="handleRowKeydown($event, row.item.id)"
              >
                <AppIcon
                  name="grip"
                  :size="14"
                />
              </button>
              <button
                v-if="row.hasChildren"
                type="button"
                class="flex size-6 shrink-0 items-center justify-center rounded text-content-muted hover:bg-neutral-soft focus-visible:outline-2 focus-visible:outline-accent"
                :aria-expanded="!row.isCollapsed"
                :aria-label="t(row.isCollapsed ? 'plan.gantt.expand' : 'plan.gantt.collapse', { name: nameOf(row.item) })"
                @click="emit('toggle', row.item.id)"
              >
                <span aria-hidden="true">{{ row.isCollapsed ? '▸' : '▾' }}</span>
              </button>
              <span
                v-else
                class="w-6 shrink-0"
              />
              <button
                type="button"
                :class="[
                  'min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left text-sm hover:underline focus-visible:outline-2 focus-visible:outline-accent',
                  KIND_CLASSES[row.item.kind],
                ]"
                :title="nameOf(row.item)"
                :aria-pressed="row.item.id === selectedItemId"
                @click="emit('select', row.item.id)"
                @keydown="menus?.handleNameKeydown($event, row.item)"
              >
                {{ nameOf(row.item) }}
              </button>
              <!--
              The note button: hover or focus shows the note quickly, a click opens it in a popup.
              Features without a note show a faint button on hover so editors can add one.
            -->
              <button
                v-if="row.item.kind === 'feature' && (row.item.note || canEdit)"
                type="button"
                :class="[
                  'flex size-6 shrink-0 items-center justify-center rounded-full focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent',
                  row.item.note
                    ? 'bg-info-soft text-info hover:bg-info hover:text-surface'
                    : 'text-content-muted opacity-0 group-hover:opacity-100 hover:bg-neutral-soft',
                ]"
                :aria-label="t(row.item.note ? 'plan.note.open' : 'plan.note.add', { name: nameOf(row.item) })"
                :aria-describedby="menus?.noteItemId === row.item.id ? menus?.noteTooltipId : undefined"
                @mouseenter="menus?.showNote($event, row.item)"
                @mouseleave="menus?.hideNote()"
                @focus="menus?.showNote($event, row.item)"
                @blur="menus?.hideNote()"
                @click="menus?.openNote(row.item.id)"
              >
                <AppIcon
                  name="info"
                  :size="14"
                />
              </button>
              <span
                v-if="isRowDone(row)"
                class="flex shrink-0 items-center gap-0.5 rounded-full bg-success px-1.5 py-0.5 text-xs font-semibold text-surface tabular-nums"
                :title="t('plan.gantt.allDone')"
              >
                <AppIcon
                  name="check"
                  :size="12"
                />
                <template v-if="row.item.kind !== 'feature'">{{ row.doneCount }}/{{ row.taskCount }}</template>
                <span
                  v-else
                  class="sr-only"
                  >{{ t('plan.gantt.allDone') }}</span
                >
              </span>
              <span
                v-else-if="row.item.kind !== 'feature' && row.taskCount"
                class="shrink-0 text-xs text-content-muted tabular-nums"
                :title="t('plan.gantt.progress', { done: row.doneCount, total: row.taskCount })"
                >{{ row.doneCount }}/{{ row.taskCount }}</span
              >
            </div>

            <div
              class="relative cursor-pointer"
              :style="{ width: `${totalWidth}px`, height: `${row.height}px` }"
              @click.self="emit('select', row.item.id)"
            >
              <div
                v-if="row.item.kind !== 'feature' && row.span"
                class="pointer-events-none absolute top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-neutral-mark"
                :style="barPosition(row.span)"
                :title="t('plan.gantt.progress', { done: row.doneCount, total: row.taskCount })"
              >
                <span
                  :class="['block h-full', isRowDone(row) ? 'bg-success-mark' : 'bg-neutral']"
                  :style="{ width: `${row.taskCount ? (row.doneCount / row.taskCount) * 100 : 0}%` }"
                />
              </div>

              <template
                v-for="bar in row.bars"
                :key="bar.task.id"
              >
                <button
                  type="button"
                  :class="[
                    'group absolute flex items-center gap-1 overflow-hidden rounded-md border-2 text-left text-xs font-semibold whitespace-nowrap shadow-sm select-none hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-content',
                    canEdit ? 'cursor-grab touch-none px-3 active:cursor-grabbing' : 'cursor-pointer px-1.5',
                    drag?.taskId === bar.task.id ? 'z-10 ring-2 ring-content/40' : '',
                  ]"
                  :style="barStyle(bar)"
                  :title="canEdit ? `${bar.description} — ${t('plan.gantt.dragTitle')}. ${t('plan.statusMenu.hint')}` : bar.description"
                  :aria-label="bar.description"
                  @pointerdown="handlePointerDown($event, bar)"
                  @pointermove="handlePointerMove"
                  @pointerup="handlePointerUp"
                  @pointercancel="drag = null"
                  @keydown="handleKeydown($event, bar)"
                  @click="handleBarClick(bar)"
                  @contextmenu="menus?.openStatusMenu($event, bar.task)"
                >
                  <!-- Visible grips on both ends: drag them to change the start or the end date. -->
                  <span
                    v-if="canEdit"
                    data-handle="start"
                    aria-hidden="true"
                    class="absolute top-0 bottom-0 left-0 flex w-2.5 cursor-ew-resize items-center justify-center gap-px bg-black/10 hover:bg-black/25"
                  >
                    <span class="pointer-events-none h-3 w-px bg-current" />
                    <span class="pointer-events-none h-3 w-px bg-current" />
                  </span>
                  <span
                    v-if="bar.task.status === 'done'"
                    aria-hidden="true"
                    >✓</span
                  >
                  <span
                    v-if="bar.width >= 64"
                    class="truncate"
                    >{{ bar.stageName }}</span
                  >
                  <span
                    v-if="canEdit"
                    data-handle="end"
                    aria-hidden="true"
                    class="absolute top-0 right-0 bottom-0 flex w-2.5 cursor-ew-resize items-center justify-center gap-px bg-black/10 hover:bg-black/25"
                  >
                    <span class="pointer-events-none h-3 w-px bg-current" />
                    <span class="pointer-events-none h-3 w-px bg-current" />
                  </span>
                </button>
                <span
                  v-if="drag?.taskId === bar.task.id"
                  role="status"
                  class="pointer-events-none absolute z-20 -translate-y-full rounded-control bg-content px-2 py-1 text-xs font-semibold whitespace-nowrap text-surface shadow-md"
                  :style="{ left: barPosition(bar.range).left, top: `${ROW_PADDING + bar.lane * LANE_HEIGHT - 4}px` }"
                  >{{ formatShortDay(bar.range.start) }} → {{ formatShortDay(bar.range.end) }} · {{ t('plan.gantt.days', durationInDays(bar.range)) }}</span
                >
              </template>
            </div>
          </div>
          <PlanDropPlaceholder
            v-if="rowDrag.isPlaceholderAt(row.item.id, 'after')"
            class="border-b border-line"
            :name="draggedLabel"
            @dragover="rowDrag.overPlaceholder"
            @drop.prevent="rowDrag.drop"
          />
        </template>
      </div>
    </div>
    <PlanContextMenus
      ref="menus"
      :can-edit="canEdit"
      :language="language"
      :statuses="statuses ?? []"
      @select="emit('select', $event)"
      @select-stage="(itemId, stageId) => emit('selectStage', itemId, stageId)"
      @open-note="emit('openNote', $event)"
      @move-item-step="(itemId, direction) => emit('moveItemStep', itemId, direction)"
      @row-action="(itemId, action) => emit('rowAction', itemId, action)"
      @remove-task="emit('removeTask', $event)"
      @change-task-status="(task, statusId) => emit('changeTaskStatus', task, statusId)"
    />
  </div>
</template>

<script setup lang="ts">
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { applyDayShift, dayOfMonth, durationInDays, isWeekend, monthSegments, readableTextColor, toIsoDate, type DayRange } from '@/utils/plan-dates';
import PlanContextMenus from '@/components/plan/PlanContextMenus.vue';
import PlanDropPlaceholder from '@/components/plan/PlanDropPlaceholder.vue';
import { usePlanRowDrag } from '@/composables/plan/usePlanRowDrag';
import { assignLanes, isRowDone, taskRange, type PlanRow } from '@/utils/plan-tree';
import type { ContentLocale } from '~~/shared/contracts/content';
import type { PlanItem, PlanItemKind, PlanStage, PlanStatus, PlanTask } from '~~/shared/contracts/plan';
import { statusOfTask } from '@/utils/plan-status';

const LABEL_WIDTH = 288;
const LANE_HEIGHT = 30;
const ROW_PADDING = 6;
const MIN_ROW_HEIGHT = 42;

const KIND_CLASSES: Record<PlanItemKind, string> = {
  phase: 'font-bold text-content',
  module: 'font-semibold text-content',
  feature: 'text-content',
};

type DragMode = 'move' | 'start' | 'end';

interface Bar {
  task: PlanTask;
  stage: PlanStage | undefined;
  stageName: string;
  range: DayRange;
  lane: number;
  width: number;
  description: string;
}

const props = defineProps<{
  rows: PlanRow[];
  stages: PlanStage[];
  /** The project's own task statuses, named in the bar tooltips and the quick menu. */
  statuses?: PlanStatus[];
  timeline: DayRange;
  dayWidth: number;
  /** Null until mounted, so the server and the browser render the same markup. */
  today: number | null;
  canEdit: boolean;
  selectedItemId: string | null;
  language: ContentLocale;
  /** Every plan item, including those inside collapsed rows, to work out where a drag would land. */
  items?: PlanItem[];
  /** Full-screen mode: the chart takes all the height it is given instead of 70% of the window. */
  isFilling?: boolean;
}>();

const emit = defineEmits<{
  select: [itemId: string];
  /** A click on one stage (bar, cell or its menu): show just that stage. */
  selectStage: [itemId: string, stageId: string];
  toggle: [itemId: string];
  moveTask: [task: PlanTask, range: DayRange];
  /** A row dropped somewhere else in the tree. */
  moveItem: [itemId: string, target: { parentId: string | null; index: number }];
  /** A row moved one place up or down with the keyboard. */
  moveItemStep: [itemId: string, direction: 'up' | 'down'];
  /** A row-menu action the page carries out: add a child (opens the panel) or delete (asks first). */
  rowAction: [itemId: string, action: 'addChild' | 'delete'];
  /** The ⓘ button of a feature: show its whole note in a popup. */
  openNote: [itemId: string];
  /** "Remove this stage from the schedule", picked from the right-click menu on a bar. */
  removeTask: [task: PlanTask];
  /** A status picked from the right-click menu on a bar. */
  changeTaskStatus: [task: PlanTask, statusId: string];
}>();

const { t, locale } = useI18n();
const hintId = useId();
const scroller = useTemplateRef<HTMLDivElement>('scroller');

const drag = ref<{ taskId: string; mode: DragMode; originX: number; origin: DayRange; delta: number; task: PlanTask } | null>(null);
// A drag ends with a click event on the same bar; it must not also open the task.
let suppressNextClick = false;

const stageById = computed(() => new Map(props.stages.map((stage) => [stage.id, stage])));
const totalWidth = computed(() => durationInDays(props.timeline) * props.dayWidth);
const months = computed(() => monthSegments(props.timeline));
const days = computed(() =>
  Array.from({ length: durationInDays(props.timeline) }, (_, index) => {
    const number = props.timeline.start + index;
    const date = dayOfMonth(number);

    // Narrow columns only number every other day so the digits never overlap.
    return { number, isWeekend: isWeekend(number), label: props.dayWidth >= 20 || date % 2 === 1 ? String(date) : '' };
  }),
);
const weekendDays = computed(() => days.value.filter((day) => day.isWeekend).map((day) => day.number));
const todayOffset = computed(() =>
  props.today !== null && props.today >= props.timeline.start && props.today <= props.timeline.end
    ? (props.today - props.timeline.start) * props.dayWidth + props.dayWidth / 2
    : null,
);
const gridLines = 'linear-gradient(to right, var(--app-color-line) 1px, transparent 1px)';

function statusLabel(task: PlanTask): string {
  const status = statusOfTask(task, props.statuses ?? []);

  return status ? resolveLocalizedText(status.name, props.language).value : t(`plan.status.${task.status}`);
}

const layout = computed(() =>
  props.rows.map((row) => {
    // Lanes come from the saved dates, so bars do not jump between lanes while one is dragged.
    const { lanes, laneCount } = assignLanes(row.tasks.map((task) => ({ id: task.id, range: taskRange(task) })));
    const bars: Bar[] = row.tasks.map((task) => {
      const stage = stageById.value.get(task.stageId);
      const range = drag.value?.taskId === task.id ? applyDayShift(drag.value.origin, drag.value.mode, drag.value.delta) : taskRange(task);
      const stageName = stage ? resolveLocalizedText(stage.name, props.language).value : '';

      return {
        task,
        stage,
        stageName,
        range,
        lane: lanes.get(task.id) ?? 0,
        width: durationInDays(range) * props.dayWidth - 2,
        description: t('plan.gantt.barLabel', {
          stage: stageName,
          start: formatDay(range.start),
          end: formatDay(range.end),
          status: statusLabel(task),
        }),
      };
    });

    return { ...row, bars, height: Math.max(MIN_ROW_HEIGHT, ROW_PADDING * 2 + laneCount * LANE_HEIGHT) };
  }),
);

function nameOf(item: PlanItem): string {
  return resolveLocalizedText(item.name, props.language).value;
}

function formatDay(day: number): string {
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(toIsoDate(day)));
}

function formatShortDay(day: number): string {
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(toIsoDate(day)));
}

// Phases and modules get a grey band so the tree reads at a glance; the selected row is tinted. The
// timeline side stays half transparent so weekend shading and the today line show through.
function rowBackground(row: PlanRow, isLabel: boolean): string {
  const item = row.item;

  if (item.id === props.selectedItemId) {
    return isLabel ? 'bg-accent-soft' : 'bg-accent-soft/60';
  }
  // Finished rows turn green, so what is done stands out at a glance.
  if (isRowDone(row)) {
    return isLabel ? 'bg-success-soft' : 'bg-success-soft/50';
  }

  const solid = { phase: 'bg-group-strong', module: 'bg-group', feature: 'bg-surface' }[item.kind];
  const tint = { phase: 'bg-group-strong/60', module: 'bg-group/60', feature: '' }[item.kind];

  return isLabel ? solid : tint;
}

function formatMonth(year: number, month: number): string {
  return new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(year, month - 1, 1));
}

function barPosition(range: DayRange): Record<string, string> {
  return { left: `${(range.start - props.timeline.start) * props.dayWidth + 1}px`, width: `${durationInDays(range) * props.dayWidth - 2}px` };
}

// Status never relies on colour alone: "to do" is a pale fill with a solid border, "done" adds a tick.
function barStyle(bar: Bar): Record<string, string> {
  const color = bar.stage?.color ?? '#535b68';
  const isTodo = bar.task.status === 'todo';

  return {
    ...barPosition(bar.range),
    top: `${ROW_PADDING + bar.lane * LANE_HEIGHT}px`,
    height: `${LANE_HEIGHT - 4}px`,
    borderColor: color,
    backgroundColor: isTodo ? `color-mix(in srgb, ${color} 22%, var(--app-color-surface))` : color,
    color: isTodo ? 'var(--app-color-content)' : readableTextColor(color),
  };
}

function handlePointerDown(event: PointerEvent, bar: Bar): void {
  if (!props.canEdit || event.button !== 0) {
    return;
  }

  const handle = (event.target as HTMLElement).dataset.handle;
  const mode: DragMode = handle === 'start' || handle === 'end' ? handle : 'move';

  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  drag.value = { taskId: bar.task.id, mode, originX: event.clientX, origin: taskRange(bar.task), delta: 0, task: bar.task };
}

function handlePointerMove(event: PointerEvent): void {
  if (drag.value) {
    drag.value.delta = Math.round((event.clientX - drag.value.originX) / props.dayWidth);
  }
}

function handlePointerUp(): void {
  const finished = drag.value;

  drag.value = null;

  if (finished && finished.delta !== 0) {
    suppressNextClick = true;
    emit('moveTask', finished.task, applyDayShift(finished.origin, finished.mode, finished.delta));
  }
}

function handleBarClick(bar: Bar): void {
  if (suppressNextClick) {
    suppressNextClick = false;

    return;
  }

  emit('selectStage', bar.task.itemId, bar.task.stageId);
}

// Arrow keys move a bar by one day; with Shift they change its end date instead. The context-menu
// key (or Shift+F10) opens the quick status menu, like a right click.
function handleKeydown(event: KeyboardEvent, bar: Bar): void {
  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
    menus.value?.openStatusMenu(event, bar.task);

    return;
  }

  const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

  if (!props.canEdit || step === undefined) {
    return;
  }

  event.preventDefault();
  emit('moveTask', bar.task, applyDayShift(taskRange(bar.task), event.shiftKey ? 'end' : 'move', step));
}

const menus = useTemplateRef<InstanceType<typeof PlanContextMenus>>('menus');

onMounted(() => {
  scroller.value?.addEventListener('scroll', () => menus.value?.close());
});

const rowDrag = usePlanRowDrag(
  () => ({ items: props.items ?? props.rows.map((row) => row.item), rows: props.rows }),
  (itemId, move) => emit('moveItem', itemId, move),
);
const draggedLabel = computed(() => (rowDrag.draggedName.value ? resolveLocalizedText(rowDrag.draggedName.value, props.language).value : null));

// The drag handle also works from the keyboard: arrow up and down move the row one place.
function handleRowKeydown(event: KeyboardEvent, itemId: string): void {
  const direction = { ArrowUp: 'up', ArrowDown: 'down' } as const;
  const step = direction[event.key as keyof typeof direction];

  if (step) {
    event.preventDefault();
    emit('moveItemStep', itemId, step);
  }
}

/** Brings today into view, a little in from the left edge. */
function scrollToToday(): void {
  if (scroller.value && todayOffset.value !== null) {
    scroller.value.scrollLeft = Math.max(0, todayOffset.value - props.dayWidth * 7);
  }
}

defineExpose({ scrollToToday });
</script>
