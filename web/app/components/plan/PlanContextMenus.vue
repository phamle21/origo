<template>
  <Teleport :to="teleportTarget">
    <div
      v-if="noteTooltip"
      :id="noteTooltipId"
      role="tooltip"
      :class="[
        'pointer-events-none fixed z-50 max-w-80 rounded-control bg-content px-3 py-2 text-xs whitespace-pre-line text-surface shadow-lg',
        noteTooltip.isAbove ? '-translate-y-full' : '',
      ]"
      :style="{ left: `${noteTooltip.x}px`, top: `${noteTooltip.y}px` }"
    >
      <span class="mb-1 flex items-center gap-1 font-semibold opacity-80"
        ><AppIcon
          name="note"
          :size="12"
        />{{ t('plan.note.title') }}</span
      >{{ noteTooltip.text }}
    </div>

    <div
      v-if="statusMenu"
      ref="statusMenuElement"
      role="menu"
      :aria-label="t('plan.statusMenu.label')"
      class="fixed z-50 flex w-52 flex-col rounded-card bg-surface p-1.5 shadow-2xl ring-1 ring-line"
      :style="{ left: `${statusMenu.x}px`, top: `${statusMenu.y}px` }"
      @keydown="handleMenuKeydown"
    >
      <p class="px-2.5 pt-1 pb-1.5 text-xs font-semibold text-content-muted">{{ t('plan.statusMenu.title') }}</p>
      <button
        v-for="status in STATUSES"
        :key="status"
        type="button"
        role="menuitemradio"
        :aria-checked="statusMenu.task.status === status"
        :class="[
          'flex min-h-9 items-center gap-2 rounded-control px-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-accent',
          statusMenu.task.status === status ? 'bg-accent-soft font-semibold text-accent-strong' : 'hover:bg-surface-muted',
        ]"
        @click="chooseStatus(status)"
      >
        <span
          aria-hidden="true"
          :class="['size-2.5 rounded-full', STATUS_DOTS[status]]"
        />
        <span class="flex-1">{{ t(`plan.status.${status}`) }}</span>
        <AppIcon
          v-if="statusMenu.task.status === status"
          name="check"
          :size="14"
        />
      </button>
      <span
        aria-hidden="true"
        class="my-1 h-px bg-line"
      />
      <button
        type="button"
        role="menuitem"
        class="flex min-h-9 items-center gap-2 rounded-control px-2.5 text-left text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent"
        @click="openDetails"
      >
        <AppIcon
          name="pencil"
          :size="14"
        />
        {{ t('plan.statusMenu.details') }}
      </button>
      <button
        type="button"
        role="menuitem"
        class="flex min-h-9 items-center gap-2 rounded-control px-2.5 text-left text-sm text-danger hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-accent"
        @click="removeStage"
      >
        <AppIcon
          name="trash"
          :size="14"
        />
        {{ t('plan.statusMenu.removeStage') }}
      </button>
    </div>

    <div
      v-if="rowMenu"
      ref="rowMenuElement"
      role="menu"
      :aria-label="t('plan.rowMenu.label', { name: nameOf(rowMenu.item) })"
      class="fixed z-50 flex w-56 flex-col rounded-card bg-surface p-1.5 shadow-2xl ring-1 ring-line"
      :style="{ left: `${rowMenu.x}px`, top: `${rowMenu.y}px` }"
      @keydown="handleMenuKeydown"
    >
      <p class="truncate px-2.5 pt-1 pb-1.5 text-xs font-semibold text-content-muted">{{ t(`plan.kind.${rowMenu.item.kind}`) }} · {{ nameOf(rowMenu.item) }}</p>
      <button
        v-for="action in rowActions"
        :key="action.id"
        type="button"
        role="menuitem"
        :class="[
          'flex min-h-9 items-center gap-2 rounded-control px-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-accent',
          action.id === 'delete' ? 'mt-1 border-t border-line pt-1 text-danger hover:bg-danger-soft' : 'hover:bg-surface-muted',
        ]"
        @click="chooseRowAction(action.id)"
      >
        <AppIcon
          :name="action.icon"
          :size="14"
        />
        {{ action.label }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import type { ContentLocale } from '~~/shared/contracts/content';
import type { PlanItem, PlanTask } from '~~/shared/contracts/plan';

/**
 * The right-click menus and the note tooltip of the plan, shared by the chart and the table: a status
 * menu for one stage of a feature, a row menu with the same actions as the details panel, and the
 * quick note shown when hovering the ⓘ button. They are drawn in a fixed layer on the page so a
 * scrolling box never cuts them off. The view opens them through the exposed functions.
 */
const props = defineProps<{ canEdit: boolean; language: ContentLocale }>();

const emit = defineEmits<{
  select: [itemId: string];
  /** A click on one stage (bar, cell or its menu): show just that stage. */
  selectStage: [itemId: string, stageId: string];
  openNote: [itemId: string];
  moveItemStep: [itemId: string, direction: 'up' | 'down'];
  rowAction: [itemId: string, action: 'addChild' | 'delete'];
  removeTask: [task: PlanTask];
  changeTaskStatus: [task: PlanTask, status: PlanTask['status']];
}>();

const { t } = useI18n();

function nameOf(item: PlanItem): string {
  return resolveLocalizedText(item.name, props.language).value;
}

const STATUSES: PlanTask['status'][] = ['todo', 'doing', 'done'];
const STATUS_DOTS = { todo: 'bg-neutral-mark', doing: 'bg-info', done: 'bg-success-mark' } as const;
const MENU_WIDTH = 208;
const MENU_HEIGHT = 260;
const ROW_MENU_WIDTH = 224;
const ROW_MENU_HEIGHT = 300;

const noteTooltipId = useId();
const noteTooltip = ref<{ itemId: string; text: string; x: number; y: number; isAbove: boolean } | null>(null);
const statusMenu = ref<{ task: PlanTask; x: number; y: number } | null>(null);
const statusMenuElement = useTemplateRef<HTMLElement>('statusMenuElement');
let menuOpener: HTMLElement | null = null;

// The note is drawn in a fixed layer on the page, so the chart's scrolling box never cuts it off.
function showNote(event: Event, item: PlanItem): void {
  if (!item.note) {
    return;
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

  // Near the bottom of the window the note opens above the button so it is never cut off.
  const isAbove = rect.bottom > window.innerHeight * 0.6;

  noteTooltip.value = {
    itemId: item.id,
    text: item.note,
    x: Math.max(8, Math.min(rect.left, window.innerWidth - 336)),
    y: isAbove ? rect.top - 6 : rect.bottom + 6,
    isAbove,
  };
}

function hideNote(): void {
  noteTooltip.value = null;
}

function openNote(itemId: string): void {
  hideNote();
  emit('openNote', itemId);
}

// Right click (or the context-menu key) on a bar: change its status in one step.
async function openStatusMenu(event: MouseEvent | KeyboardEvent, task: PlanTask): Promise<void> {
  // Readers fall through to the row menu (details, note) since they cannot change a status.
  if (!props.canEdit) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  rowMenu.value = null;
  menuOpener = event.currentTarget as HTMLElement;

  const rect = menuOpener.getBoundingClientRect();
  const pointer = event instanceof MouseEvent && event.clientX ? { x: event.clientX, y: event.clientY } : { x: rect.left, y: rect.bottom + 4 };

  statusMenu.value = {
    task,
    x: Math.max(8, Math.min(pointer.x, window.innerWidth - MENU_WIDTH - 8)),
    y: Math.max(8, Math.min(pointer.y, window.innerHeight - MENU_HEIGHT - 8)),
  };
  await nextTick();
  statusMenuElement.value?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
}

function closeStatusMenu(returnFocus = false): void {
  statusMenu.value = null;
  rowMenu.value = null;

  if (returnFocus) {
    menuOpener?.focus();
  }
}

function chooseStatus(status: PlanTask['status']): void {
  const task = statusMenu.value?.task;

  closeStatusMenu(true);

  if (task && task.status !== status) {
    emit('changeTaskStatus', task, status);
  }
}

function removeStage(): void {
  const task = statusMenu.value?.task;

  closeStatusMenu(true);

  if (task) {
    emit('removeTask', task);
  }
}

function openDetails(): void {
  const task = statusMenu.value?.task;

  closeStatusMenu();

  if (task) {
    emit('selectStage', task.itemId, task.stageId);
  }
}

type RowAction = 'details' | 'note' | 'addChild' | 'up' | 'down' | 'delete';

const rowMenu = ref<{ item: PlanItem; x: number; y: number } | null>(null);
const rowMenuElement = useTemplateRef<HTMLElement>('rowMenuElement');

// What a right click on a row offers: the same things as the details panel, filtered by rights.
const rowActions = computed(() => {
  const item = rowMenu.value?.item;

  if (!item) {
    return [];
  }

  const isFeature = item.kind === 'feature';
  const actions: { id: RowAction; label: string; icon: AppIconName; isShown: boolean }[] = [
    { id: 'details', label: t('plan.statusMenu.details'), icon: 'pencil', isShown: true },
    {
      id: 'note',
      label: t(item.note ? 'plan.rowMenu.viewNote' : 'plan.rowMenu.addNote'),
      icon: 'info',
      isShown: isFeature && (Boolean(item.note) || props.canEdit),
    },
    {
      id: 'addChild',
      label: t(item.kind === 'phase' ? 'plan.rowMenu.addModule' : 'plan.rowMenu.addFeature'),
      icon: 'plus',
      isShown: props.canEdit && !isFeature,
    },
    { id: 'up', label: t('plan.panel.moveUp'), icon: 'arrowUp', isShown: props.canEdit },
    { id: 'down', label: t('plan.panel.moveDown'), icon: 'arrowDown', isShown: props.canEdit },
    { id: 'delete', label: t('plan.panel.delete'), icon: 'trash', isShown: props.canEdit },
  ];

  return actions.filter((action) => action.isShown);
});

async function openRowMenu(event: MouseEvent | KeyboardEvent, item: PlanItem): Promise<void> {
  event.preventDefault();
  statusMenu.value = null;
  hideNote();
  menuOpener = event.currentTarget as HTMLElement;

  const rect = menuOpener.getBoundingClientRect();
  const pointer = event instanceof MouseEvent && event.clientX ? { x: event.clientX, y: event.clientY } : { x: rect.left + 24, y: rect.bottom + 4 };

  rowMenu.value = {
    item,
    x: Math.max(8, Math.min(pointer.x, window.innerWidth - ROW_MENU_WIDTH - 8)),
    y: Math.max(8, Math.min(pointer.y, window.innerHeight - ROW_MENU_HEIGHT - 8)),
  };
  await nextTick();
  rowMenuElement.value?.querySelector<HTMLElement>('button')?.focus();
}

function handleNameKeydown(event: KeyboardEvent, item: PlanItem): void {
  if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
    openRowMenu(event, item);
  }
}

function chooseRowAction(action: RowAction): void {
  const item = rowMenu.value?.item;

  closeStatusMenu(action !== 'details' && action !== 'note');

  if (!item) {
    return;
  }
  if (action === 'details') {
    emit('select', item.id);
  } else if (action === 'note') {
    emit('openNote', item.id);
  } else if (action === 'up' || action === 'down') {
    emit('moveItemStep', item.id, action);
  } else {
    emit('rowAction', item.id, action);
  }
}

function handleMenuKeydown(event: KeyboardEvent): void {
  const menu = statusMenuElement.value ?? rowMenuElement.value;
  const items = [...(menu?.querySelectorAll<HTMLElement>('button') ?? [])];
  const current = items.indexOf(document.activeElement as HTMLElement);

  if (event.key === 'Escape' || event.key === 'Tab') {
    event.preventDefault();
    closeStatusMenu(true);
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    items[(current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  }
}

function handleOutsidePointer(event: Event): void {
  const target = event.target as Node;

  if ((statusMenu.value || rowMenu.value) && !statusMenuElement.value?.contains(target) && !rowMenuElement.value?.contains(target)) {
    closeStatusMenu();
  }
}

onMounted(() => document.addEventListener('mousedown', handleOutsidePointer));
onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutsidePointer));

// While something is shown full screen, only what is inside it is visible, so the menus move there.
const teleportTarget = ref<string | HTMLElement>('body');

function handleFullscreenChange(): void {
  close();
  teleportTarget.value = (document.fullscreenElement as HTMLElement | null) ?? 'body';
}

// A view switched while in full screen (chart ↔ table) mounts new menus: they must start inside it too.
onMounted(() => {
  teleportTarget.value = (document.fullscreenElement as HTMLElement | null) ?? 'body';
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', handleFullscreenChange));

const noteItemId = computed(() => noteTooltip.value?.itemId ?? null);

/** Closes every menu and the tooltip, e.g. when the view scrolls. */
function close(): void {
  closeStatusMenu();
  hideNote();
}

defineExpose({ openStatusMenu, openRowMenu, handleNameKeydown, showNote, hideNote, openNote, close, noteItemId, noteTooltipId });
</script>
