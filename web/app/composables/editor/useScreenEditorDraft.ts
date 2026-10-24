import type { Box } from '@/utils/box-geometry';
import { createEmptyPointDraft, createPointDrafts, moveDraft, type PointDraft, toPointsPayload } from '@/utils/screen-draft';
import type { ScreenDetail } from '~~/shared/contracts/screen';
import type { ScreenTextsPayload } from '~~/shared/contracts/screen-editor';

/**
 * Client-side working copy of one screen while it is edited. It is created once from the loaded screen
 * and is not reset when the screen data refreshes (for example after replacing the screenshot), so
 * unsaved work survives. Dirtiness compares the saveable payload, not the editor's own keys.
 */
export function useScreenEditorDraft(screen: ScreenDetail) {
  let newPointCount = 0;

  const points = ref<PointDraft[]>(createPointDrafts(screen.points));
  const texts = ref<ScreenTextsPayload>({ name: { ...screen.name }, flow: { ...screen.flow }, purpose: { ...screen.purpose } });
  const selectedKey = ref<string | null>(points.value[0]?.key ?? null);

  const snapshot = ref(serialize());
  // Plain copies of the last saved state, so Undo can put every point and text back.
  let savedPoints = clone(points.value);
  let savedTexts = clone(texts.value);

  function clone<TValue>(value: TValue): TValue {
    return JSON.parse(JSON.stringify(value)) as TValue;
  }

  function serialize(): string {
    return JSON.stringify({ points: toPointsPayload(points.value), texts: texts.value });
  }

  const isDirty = computed(() => serialize() !== snapshot.value);
  const areTextsDirty = computed(() => JSON.stringify(texts.value) !== JSON.stringify(JSON.parse(snapshot.value).texts));
  const selectedIndex = computed(() => points.value.findIndex((point) => point.key === selectedKey.value));
  const selectedPoint = computed(() => points.value[selectedIndex.value] ?? null);

  function addPoint(box: Box): void {
    newPointCount += 1;

    const draft = createEmptyPointDraft(`new-${newPointCount}`, box);

    points.value = [...points.value, draft];
    selectedKey.value = draft.key;
  }

  function replacePoint(updated: PointDraft): void {
    points.value = points.value.map((point) => (point.key === updated.key ? updated : point));
  }

  function changeBox(key: string, box: Box): void {
    points.value = points.value.map((point) => (point.key === key ? { ...point, box } : point));
  }

  function removePoint(key: string): void {
    const index = points.value.findIndex((point) => point.key === key);

    points.value = points.value.filter((point) => point.key !== key);

    if (selectedKey.value === key) {
      selectedKey.value = points.value[Math.min(index, points.value.length - 1)]?.key ?? null;
    }
  }

  function movePoint(index: number, offset: number): void {
    points.value = moveDraft(points.value, index, offset);
  }

  function markSaved(): void {
    snapshot.value = serialize();
    savedPoints = clone(points.value);
    savedTexts = clone(texts.value);
  }

  function revert(): void {
    points.value = clone(savedPoints);
    texts.value = clone(savedTexts);

    if (!points.value.some((point) => point.key === selectedKey.value)) {
      selectedKey.value = points.value[0]?.key ?? null;
    }
  }

  return {
    points,
    texts,
    selectedKey,
    selectedIndex,
    selectedPoint,
    isDirty,
    areTextsDirty,
    addPoint,
    replacePoint,
    changeBox,
    removePoint,
    movePoint,
    markSaved,
    revert,
  };
}
