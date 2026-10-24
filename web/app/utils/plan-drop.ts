import type { PlanItem, PlanItemKind } from '~~/shared/contracts/plan';

const PARENT_KIND: Record<PlanItemKind, PlanItemKind | null> = { phase: null, module: 'phase', feature: 'module' };

export type DropZone = 'before' | 'after';

export interface DropTarget {
  /** Where the line or highlight is drawn. */
  rowId: string;
  mode: 'before' | 'after' | 'inside';
  /** What the API needs: the new parent and the index among its children (without the dragged item). */
  parentId: string | null;
  index: number;
}

/**
 * Where a dragged plan item would land when dropped on a row. Over a row of the same kind it goes
 * before or after that row (by which half the pointer is in); over a row of its parent kind it goes
 * to the end of that group (a feature into another module, a module into another phase). Anything
 * else — another level, or the item itself — is not a valid drop and returns null.
 */
export function resolvePlanDrop(items: PlanItem[], draggedId: string, rowId: string, zone: DropZone): DropTarget | null {
  const dragged = items.find((item) => item.id === draggedId);
  const row = items.find((item) => item.id === rowId);

  if (!dragged || !row || dragged.id === row.id) {
    return null;
  }

  const childrenOf = (parentId: string | null) =>
    items.filter((item) => item.parentId === parentId && item.id !== dragged.id).sort((left, right) => left.position - right.position);

  if (row.kind === dragged.kind) {
    const siblings = childrenOf(row.parentId);
    const rowIndex = siblings.findIndex((item) => item.id === row.id);

    return { rowId, mode: zone, parentId: row.parentId, index: zone === 'before' ? rowIndex : rowIndex + 1 };
  }

  if (row.kind === PARENT_KIND[dragged.kind]) {
    return { rowId, mode: 'inside', parentId: row.id, index: childrenOf(row.id).length };
  }

  return null;
}

/** True when the drop would leave the item exactly where it already is. */
export function isSamePlace(items: PlanItem[], draggedId: string, target: DropTarget): boolean {
  const dragged = items.find((item) => item.id === draggedId);

  if (!dragged || dragged.parentId !== target.parentId) {
    return false;
  }

  const siblings = items.filter((item) => item.parentId === dragged.parentId).sort((left, right) => left.position - right.position);

  return siblings.findIndex((item) => item.id === dragged.id) === target.index;
}
