import { isSamePlace, resolvePlanDrop, type DropTarget } from '@/utils/plan-drop';
import type { PlanRow } from '@/utils/plan-tree';
import type { PlanItem } from '~~/shared/contracts/plan';

export interface PlanRowMove {
  parentId: string | null;
  index: number;
}

/** Where the dashed "drop here" box is drawn among the visible rows. */
export interface DropPlaceholder {
  rowId: string;
  side: 'before' | 'after';
}

/**
 * Dragging plan rows by their ⋮⋮ handle, shared by the chart and the table. While a row is dragged, a
 * dashed box the size of a row opens where it would land (like a jQuery UI sortable placeholder):
 * before a row, or after a row and everything shown under it.
 */
export function usePlanRowDrag(source: () => { items: PlanItem[]; rows: PlanRow[] }, onMove: (itemId: string, move: PlanRowMove) => void) {
  const draggedId = ref<string | null>(null);
  const dropTarget = ref<DropTarget | null>(null);

  const draggedName = computed(() => source().items.find((item) => item.id === draggedId.value)?.name ?? null);

  const placeholder = computed<DropPlaceholder | null>(() => {
    const target = dropTarget.value;

    if (!target) {
      return null;
    }
    if (target.mode === 'before') {
      return { rowId: target.rowId, side: 'before' };
    }

    // After a row (or at the end of a group): below the last visible row inside it.
    const rows = source().rows;
    const start = rows.findIndex((row) => row.item.id === target.rowId);
    let last = start;

    while (start >= 0 && last + 1 < rows.length && (rows[last + 1]?.depth ?? 0) > (rows[start]?.depth ?? 0)) {
      last += 1;
    }

    return { rowId: rows[last]?.item.id ?? target.rowId, side: 'after' };
  });

  function start(event: DragEvent, itemId: string, dragImage?: Element | null): void {
    draggedId.value = itemId;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);

      if (dragImage) {
        event.dataTransfer.setDragImage(dragImage, 24, 16);
      }
    }
  }

  function accept(event: DragEvent): void {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  // Only a valid place accepts the drop (preventDefault); elsewhere the browser shows "not allowed".
  function over(event: DragEvent, rowId: string): void {
    if (!draggedId.value) {
      return;
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const zone = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    const target = resolvePlanDrop(source().items, draggedId.value, rowId, zone);

    dropTarget.value = target;

    if (target) {
      accept(event);
    }
  }

  /** The placeholder itself keeps the current target, so hovering it never makes it jump. */
  function overPlaceholder(event: DragEvent): void {
    if (draggedId.value && dropTarget.value) {
      accept(event);
    }
  }

  function drop(): void {
    const itemId = draggedId.value;
    const target = dropTarget.value;

    reset();

    if (itemId && target && !isSamePlace(source().items, itemId, target)) {
      onMove(itemId, { parentId: target.parentId, index: target.index });
    }
  }

  function reset(): void {
    draggedId.value = null;
    dropTarget.value = null;
  }

  function isPlaceholderAt(rowId: string, side: DropPlaceholder['side']): boolean {
    return placeholder.value?.rowId === rowId && placeholder.value.side === side;
  }

  return { draggedId, draggedName, dropTarget, placeholder, isPlaceholderAt, start, over, overPlaceholder, drop, reset };
}
