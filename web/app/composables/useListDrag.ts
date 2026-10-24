/**
 * Reordering a flat list by dragging. `dropIndex` is the gap (0…length) where the dashed placeholder is
 * drawn: before the hovered row in its upper half, after it in its lower half.
 */
export function useListDrag(onMove: (from: number, to: number) => void) {
  const draggedIndex = ref<number | null>(null);
  const dropIndex = ref<number | null>(null);

  function start(event: DragEvent, index: number, dragImage?: Element | null): void {
    draggedIndex.value = index;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));

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

  function over(event: DragEvent, index: number): void {
    if (draggedIndex.value === null) {
      return;
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    dropIndex.value = event.clientY < rect.top + rect.height / 2 ? index : index + 1;
    accept(event);
  }

  /** The placeholder keeps the current gap, so hovering it never makes it jump. */
  function overPlaceholder(event: DragEvent): void {
    if (draggedIndex.value !== null) {
      accept(event);
    }
  }

  function drop(): void {
    const from = draggedIndex.value;
    const gap = dropIndex.value;

    reset();

    if (from === null || gap === null) {
      return;
    }

    // Taking the row out first shifts every later gap up by one.
    const to = gap > from ? gap - 1 : gap;

    if (to !== from) {
      onMove(from, to);
    }
  }

  function reset(): void {
    draggedIndex.value = null;
    dropIndex.value = null;
  }

  return { draggedIndex, dropIndex, start, over, overPlaceholder, drop, reset };
}
