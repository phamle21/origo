import type { LocalizedText } from '~~/shared/contracts/content';
import type { ScreenPoint } from '~~/shared/contracts/screen';
import type { PointDraftPayload } from '~~/shared/contracts/screen-editor';
import type { Box } from './box-geometry';

/** A point being edited; `key` identifies it in the editor, including points not saved yet. */
export interface PointDraft extends PointDraftPayload {
  key: string;
}

export function emptyLocalizedText(): LocalizedText {
  return { vi: null };
}

export function createPointDrafts(points: ScreenPoint[]): PointDraft[] {
  return points.map((point) => ({
    key: point.id,
    id: point.id,
    box: [...point.box],
    title: { ...point.title },
    basic: { summary: { ...point.basic.summary }, rules: point.basic.rules.map((rule) => ({ ...rule })) },
    detail: { rows: point.detail.rows.map((row) => ({ item: { ...row.item }, spec: { ...row.spec } })), endpoints: [...point.detail.endpoints] },
    tests: point.tests.map((test) => ({ given: { ...test.given }, when: { ...test.when }, then: { ...test.then } })),
    history: point.history.map((entry) => ({ phase: entry.phase, note: { ...entry.note } })),
    concepts: point.concepts.map((concept) => concept.key),
    dependsOn: point.dependsOn.map((link) => link.pointId),
  }));
}

export function createEmptyPointDraft(key: string, box: Box): PointDraft {
  return {
    key,
    id: null,
    box,
    title: emptyLocalizedText(),
    basic: { summary: emptyLocalizedText(), rules: [] },
    detail: { rows: [], endpoints: [] },
    tests: [],
    history: [],
    concepts: [],
    dependsOn: [],
  };
}

/** Moves the draft at `index` by `offset` places; the order is the numbering. */
export function moveDraft(drafts: readonly PointDraft[], index: number, offset: number): PointDraft[] {
  const target = index + offset;

  if (index < 0 || index >= drafts.length || target < 0 || target >= drafts.length) {
    return [...drafts];
  }

  const reordered = [...drafts];
  const [moved] = reordered.splice(index, 1);

  if (moved) {
    reordered.splice(target, 0, moved);
  }

  return reordered;
}

function isBlank(text: LocalizedText): boolean {
  return Object.values(text).every((value) => !value?.trim());
}

/** Rows the author added but left empty are dropped instead of failing the whole save. */
export function toPointsPayload(drafts: readonly PointDraft[]): PointDraftPayload[] {
  return drafts.map(({ key: _key, ...payload }) => ({
    ...payload,
    basic: { ...payload.basic, rules: payload.basic.rules.filter((rule) => !isBlank(rule)) },
    detail: {
      rows: payload.detail.rows.filter((row) => !isBlank(row.item) || !isBlank(row.spec)),
      endpoints: payload.detail.endpoints.map((endpoint) => endpoint.trim()).filter(Boolean),
    },
    tests: payload.tests.filter((test) => !isBlank(test.given) || !isBlank(test.when) || !isBlank(test.then)),
    history: payload.history.filter((entry) => entry.phase.trim() || !isBlank(entry.note)),
  }));
}

/** A point without a Vietnamese title cannot be saved; the editor points the author to it. */
export function findUntitledDraftIndex(drafts: readonly PointDraft[]): number {
  return drafts.findIndex((draft) => !draft.title.vi?.trim());
}
