<template>
  <div
    :class="['rounded-card border border-line bg-surface shadow-card', isFilling ? 'min-h-0 flex-1 overflow-auto' : 'overflow-x-auto']"
    @scroll="menus?.close()"
  >
    <table class="w-full min-w-max border-collapse text-sm">
      <caption class="sr-only">
        {{
          t('plan.table.caption')
        }}
      </caption>
      <thead class="bg-toolbar">
        <tr>
          <th
            scope="col"
            class="sticky left-0 z-10 min-w-64 border-r border-b border-line-strong bg-toolbar px-3 py-2 text-left text-xs font-semibold text-content-muted"
          >
            {{ t('plan.gantt.item') }}
          </th>
          <th
            v-for="stage in stages"
            :key="stage.id"
            scope="col"
            class="min-w-36 border-b border-line-strong px-3 py-2 text-left text-xs font-semibold"
          >
            <span class="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                class="size-2.5 rounded-full"
                :style="{ backgroundColor: stage.color }"
              />
              {{ resolveLocalizedText(stage.name, language).value }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <template
          v-for="row in rows"
          :key="row.item.id"
        >
          <tr
            v-if="rowDrag.isPlaceholderAt(row.item.id, 'before')"
            class="border-b border-line"
            @dragover="rowDrag.overPlaceholder"
            @drop.prevent="rowDrag.drop"
          >
            <PlanDropPlaceholder
              as="td"
              :colspan="stages.length + 1"
              :name="draggedLabel"
            />
          </tr>
          <tr
            :class="[
              'border-b border-line',
              row.item.id === selectedItemId ? 'bg-accent-soft/60' : isRowDone(row) ? 'bg-success-soft/50' : '',
              rowDrag.draggedId.value === row.item.id ? 'opacity-40' : '',
              rowDrag.dropTarget.value?.rowId === row.item.id && rowDrag.dropTarget.value.mode === 'inside' ? 'outline-2 -outline-offset-2 outline-accent' : '',
            ]"
            class="group"
            @dragover="rowDrag.over($event, row.item.id)"
            @drop.prevent="rowDrag.drop"
            @contextmenu="menus?.openRowMenu($event, row.item)"
          >
            <th
              scope="row"
              :class="[
                'sticky left-0 z-10 border-r border-line px-3 py-2 text-left font-normal',
                row.item.id === selectedItemId ? 'bg-accent-soft' : isRowDone(row) ? 'bg-success-soft' : 'bg-surface',
              ]"
              :style="{ paddingLeft: `${(canEdit ? 4 : 12) + row.depth * 16}px` }"
            >
              <span class="flex items-start gap-1">
                <button
                  v-if="canEdit"
                  type="button"
                  draggable="true"
                  class="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-content-muted hover:bg-neutral-soft hover:text-content focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
                  :aria-label="t('plan.gantt.dragRow', { name: resolveLocalizedText(row.item.name, language).value })"
                  :title="t('plan.gantt.dragRow', { name: resolveLocalizedText(row.item.name, language).value })"
                  @dragstart="rowDrag.start($event, row.item.id, ($event.currentTarget as HTMLElement).closest('th'))"
                  @dragend="rowDrag.reset"
                  @keydown="handleRowKeydown($event, row.item.id)"
                >
                  <AppIcon
                    name="grip"
                    :size="14"
                  />
                </button>
                <button
                  type="button"
                  :class="[
                    'text-left hover:underline focus-visible:outline-2 focus-visible:outline-accent',
                    row.item.kind === 'feature' ? '' : 'font-semibold',
                  ]"
                  :aria-pressed="row.item.id === selectedItemId"
                  @click="emit('select', row.item.id)"
                  @keydown="menus?.handleNameKeydown($event, row.item)"
                >
                  {{ resolveLocalizedText(row.item.name, language).value }}
                </button>
                <button
                  v-if="row.item.kind === 'feature' && (row.item.note || canEdit)"
                  type="button"
                  :class="[
                    'flex size-6 shrink-0 items-center justify-center rounded-full focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-accent',
                    row.item.note
                      ? 'bg-info-soft text-info hover:bg-info hover:text-surface'
                      : 'text-content-muted opacity-0 group-hover:opacity-100 hover:bg-neutral-soft',
                  ]"
                  :aria-label="t(row.item.note ? 'plan.note.open' : 'plan.note.add', { name: resolveLocalizedText(row.item.name, language).value })"
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
                  class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-surface"
                  :title="t('plan.gantt.allDone')"
                >
                  <AppIcon
                    name="check"
                    :size="12"
                  />
                  <span class="sr-only">{{ t('plan.gantt.allDone') }}</span>
                </span>
              </span>
            </th>
            <td
              v-for="stage in stages"
              :key="stage.id"
              class="px-3 py-2 align-top"
            >
              <button
                v-if="taskFor(row, stage.id)"
                type="button"
                class="-mx-1.5 -my-1 flex flex-col items-start gap-1 rounded-control px-1.5 py-1 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent"
                :aria-label="`${resolveLocalizedText(stage.name, language).value}: ${formatRange(taskFor(row, stage.id)!)}, ${t(`plan.status.${taskFor(row, stage.id)!.status}`)}`"
                :title="canEdit ? t('plan.statusMenu.hint') : undefined"
                @click="emit('selectStage', row.item.id, stage.id)"
                @contextmenu="menus?.openStatusMenu($event, taskFor(row, stage.id)!)"
                @keydown="handleCellKeydown($event, taskFor(row, stage.id)!)"
              >
                <span class="block text-xs tabular-nums">{{ formatRange(taskFor(row, stage.id)!) }}</span>
                <AppBadge :tone="STATUS_TONES[taskFor(row, stage.id)!.status]">{{ t(`plan.status.${taskFor(row, stage.id)!.status}`) }}</AppBadge>
              </button>
              <span
                v-else-if="row.item.kind === 'feature'"
                class="text-content-muted"
                aria-hidden="true"
                >—</span
              >
            </td>
          </tr>
          <tr
            v-if="rowDrag.isPlaceholderAt(row.item.id, 'after')"
            class="border-b border-line"
            @dragover="rowDrag.overPlaceholder"
            @drop.prevent="rowDrag.drop"
          >
            <PlanDropPlaceholder
              as="td"
              :colspan="stages.length + 1"
              :name="draggedLabel"
            />
          </tr>
        </template>
      </tbody>
    </table>
    <PlanContextMenus
      ref="menus"
      :can-edit="canEdit"
      :language="language"
      @select="emit('select', $event)"
      @select-stage="(itemId, stageId) => emit('selectStage', itemId, stageId)"
      @open-note="emit('openNote', $event)"
      @move-item-step="(itemId, direction) => emit('moveItemStep', itemId, direction)"
      @row-action="(itemId, action) => emit('rowAction', itemId, action)"
      @remove-task="emit('removeTask', $event)"
      @change-task-status="(task, status) => emit('changeTaskStatus', task, status)"
    />
  </div>
</template>

<script setup lang="ts">
import PlanContextMenus from '@/components/plan/PlanContextMenus.vue';
import PlanDropPlaceholder from '@/components/plan/PlanDropPlaceholder.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { usePlanRowDrag, type PlanRowMove } from '@/composables/plan/usePlanRowDrag';
import { resolveLocalizedText } from '@/utils/content-language';
import { isRowDone, type PlanRow } from '@/utils/plan-tree';
import type { ContentLocale } from '~~/shared/contracts/content';
import type { PlanItem, PlanStage, PlanTask } from '~~/shared/contracts/plan';

const STATUS_TONES = { todo: 'neutral', doing: 'info', done: 'success' } as const;

const props = withDefaults(
  defineProps<{
    rows: PlanRow[];
    stages: PlanStage[];
    selectedItemId: string | null;
    language: ContentLocale;
    /** Every plan item, including those inside collapsed rows, to work out where a drag would land. */
    items?: PlanItem[];
    canEdit?: boolean;
    /** Full-screen mode: the table takes all the height it is given and scrolls inside. */
    isFilling?: boolean;
  }>(),
  { items: undefined, canEdit: false, isFilling: false },
);

const emit = defineEmits<{
  select: [itemId: string];
  /** A click on one stage (bar, cell or its menu): show just that stage. */
  selectStage: [itemId: string, stageId: string];
  moveItem: [itemId: string, move: PlanRowMove];
  moveItemStep: [itemId: string, move: 'up' | 'down'];
  rowAction: [itemId: string, action: 'addChild' | 'delete'];
  openNote: [itemId: string];
  removeTask: [task: PlanTask];
  changeTaskStatus: [task: PlanTask, status: PlanTask['status']];
}>();

const { t, locale } = useI18n();
const menus = useTemplateRef<InstanceType<typeof PlanContextMenus>>('menus');

// The context-menu key (or Shift+F10) on a stage cell opens the quick status menu, like a right click.
function handleCellKeydown(event: KeyboardEvent, task: PlanTask): void {
  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
    menus.value?.openStatusMenu(event, task);
  }
}

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

function taskFor(row: PlanRow, stageId: string): PlanTask | undefined {
  return row.tasks.find((task) => task.stageId === stageId);
}

function formatRange(task: PlanTask): string {
  const format = new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'numeric', timeZone: 'UTC' });

  return `${format.format(new Date(task.startDate))} – ${format.format(new Date(task.endDate))}`;
}
</script>
