import { describe, expect, test } from 'vitest';
import { useScreenEditorDraft } from '@/composables/editor/useScreenEditorDraft';
import { buildScreenDetail } from '~~/server/services/screen/screen';
import { DEMO_PROJECTS } from '~~/test/fixtures/screen-map';

function createDraft() {
  const project = DEMO_PROJECTS[0];

  if (!project) {
    throw new Error('fixture project is missing');
  }

  return useScreenEditorDraft(buildScreenDetail(project, 'SC-02'));
}

describe('useScreenEditorDraft', () => {
  test('starts clean with the first point selected', () => {
    const draft = createDraft();

    expect(draft.isDirty.value).toBe(false);
    expect(draft.selectedKey.value).toBe('SC-02-1');
    expect(draft.points.value).toHaveLength(4);
  });

  test('adds a point at the end, selects it and becomes dirty', () => {
    const draft = createDraft();

    draft.addPoint([1, 2, 3, 4]);

    expect(draft.points.value).toHaveLength(5);
    expect(draft.selectedPoint.value).toMatchObject({ key: 'new-1', id: null, box: [1, 2, 3, 4] });
    expect(draft.selectedIndex.value).toBe(4);
    expect(draft.isDirty.value).toBe(true);
  });

  test('moves, reboxes and replaces points by key', () => {
    const draft = createDraft();

    draft.movePoint(0, 1);
    draft.changeBox('SC-02-1', [5, 5, 5, 5]);
    const first = draft.points.value[0];

    if (first) {
      draft.replacePoint({ ...first, title: { vi: 'Đổi tên', ja: null } });
    }

    expect(draft.points.value.map((point) => point.key).slice(0, 2)).toEqual(['SC-02-2', 'SC-02-1']);
    expect(draft.points.value[1]?.box).toEqual([5, 5, 5, 5]);
    expect(draft.points.value[0]?.title.vi).toBe('Đổi tên');
  });

  test('selects the neighbouring point after removing the selected one', () => {
    const draft = createDraft();

    draft.selectedKey.value = 'SC-02-4';
    draft.removePoint('SC-02-4');

    expect(draft.selectedKey.value).toBe('SC-02-3');

    draft.removePoint('SC-02-1');

    expect(draft.selectedKey.value).toBe('SC-02-3');
  });

  test('tracks screen texts separately and is clean again after saving', () => {
    const draft = createDraft();

    draft.texts.value = { ...draft.texts.value, name: { vi: 'Giỏ', ja: null } };

    expect(draft.areTextsDirty.value).toBe(true);

    draft.markSaved();

    expect(draft.isDirty.value).toBe(false);
    expect(draft.areTextsDirty.value).toBe(false);
  });
});
