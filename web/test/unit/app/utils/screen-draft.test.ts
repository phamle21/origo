import { describe, expect, test } from 'vitest';
import { createEmptyPointDraft, createPointDrafts, findUntitledDraftIndex, moveDraft, toPointsPayload } from '@/utils/screen-draft';
import { buildScreenDetail } from '~~/server/services/screen/screen';
import { DEMO_PROJECTS } from '~~/test/fixtures/screen-map';

const learning = DEMO_PROJECTS[0];

describe('screen drafts', () => {
  test('turns saved points into drafts with concept keys and dependency ids', () => {
    if (!learning) {
      throw new Error('fixture project is missing');
    }

    const [first] = createPointDrafts(buildScreenDetail(learning, 'SC-02').points);

    expect(first).toMatchObject({ key: 'SC-02-1', id: 'SC-02-1', concepts: ['course-price'], dependsOn: ['SC-01-3'] });
  });

  test('round-trips a draft into the save payload without the editor key', () => {
    const draft = createEmptyPointDraft('new-1', [1, 2, 3, 4]);
    const [payload] = toPointsPayload([draft]);

    expect(payload).not.toHaveProperty('key');
    expect(payload).toMatchObject({ id: null, box: [1, 2, 3, 4] });
  });

  test('drops rows the author added but left empty', () => {
    const draft = {
      ...createEmptyPointDraft('new-1', [1, 2, 3, 4]),
      basic: {
        summary: { vi: null, ja: null },
        rules: [
          { vi: '  ', ja: null },
          { vi: 'Đã gồm thuế', ja: null },
        ],
      },
      detail: { rows: [{ item: { vi: null, ja: null }, spec: { vi: null, ja: null } }], endpoints: ['', ' GET /a ', ''] },
      tests: [{ given: { vi: null, ja: null }, when: { vi: null, ja: null }, then: { vi: null, ja: null } }],
      history: [{ phase: ' ', note: { vi: null, ja: null } }],
    };

    expect(toPointsPayload([draft])[0]).toMatchObject({
      basic: { rules: [{ vi: 'Đã gồm thuế', ja: null }] },
      detail: { rows: [], endpoints: ['GET /a'] },
      tests: [],
      history: [],
    });
  });

  test('reorders drafts and leaves the order unchanged for a move past either end', () => {
    const drafts = ['a', 'b', 'c'].map((key) => createEmptyPointDraft(key, [0, 0, 1, 1]));

    expect(moveDraft(drafts, 2, -2).map((draft) => draft.key)).toEqual(['c', 'a', 'b']);
    expect(moveDraft(drafts, 0, -1).map((draft) => draft.key)).toEqual(['a', 'b', 'c']);
    expect(moveDraft(drafts, 2, 1).map((draft) => draft.key)).toEqual(['a', 'b', 'c']);
  });

  test('finds the first point without a Vietnamese title', () => {
    const titled = { ...createEmptyPointDraft('a', [0, 0, 1, 1]), title: { vi: 'Giá', ja: null } };
    const untitled = { ...createEmptyPointDraft('b', [0, 0, 1, 1]), title: { vi: '   ', ja: '価格' } };

    expect(findUntitledDraftIndex([titled, untitled])).toBe(1);
    expect(findUntitledDraftIndex([titled])).toBe(-1);
  });
});
