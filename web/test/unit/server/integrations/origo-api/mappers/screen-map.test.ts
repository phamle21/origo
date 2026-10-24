import { describe, expect, test } from 'vitest';
import { projectListDtoSchema, projectMapDtoSchema } from '~~/server/integrations/origo-api/dto/screen-map.dto';
import { toProjectRecord, toProjectSummaries } from '~~/server/integrations/origo-api/mappers/screen-map';

const minimalPoint = {
  id: '01j0000000000000000000000a',
  number: 1,
  title: { vi: 'Giá', ja: null },
  box: [10, 10, 20, 10],
  basic: { summary: { vi: 'Hiện giá' } },
  detail: {},
};

function mapResponse(points: unknown[]) {
  return {
    data: {
      code: 'LMS',
      name: { vi: 'Cổng học', ja: 'ポータル' },
      description: null,
      concepts: [],
      screens: [
        {
          id: 's1',
          code: 'SC-01',
          name: { vi: 'Giỏ hàng' },
          flow: null,
          purpose: { vi: null, ja: null },
          image: { src: 'http://api.origo.local/storage/screens/a.webp', width: 1_200, height: 760 },
          points,
        },
      ],
      futureField: 'ignored',
    },
  };
}

describe('screen map DTO', () => {
  test('fills absent optional parts so a sparse point maps to a complete record', () => {
    const record = toProjectRecord(projectMapDtoSchema.parse(mapResponse([minimalPoint])));
    const point = record.screens[0]?.points[0];

    // Only Vietnamese is guaranteed; other languages appear when the API sends them.
    expect(record.description).toEqual({ vi: null });
    expect(record.screens[0]?.flow).toEqual({ vi: null });
    expect(point).toMatchObject({
      title: { vi: 'Giá', ja: null },
      basic: { summary: { vi: 'Hiện giá' }, rules: [] },
      detail: { rows: [], endpoints: [] },
      tests: [],
      history: [],
      concepts: [],
      dependsOn: [],
      comments: [],
    });
  });

  test('rejects a point without a box or with a malformed one', () => {
    expect(() => projectMapDtoSchema.parse(mapResponse([{ ...minimalPoint, box: [10, 10, 20] }]))).toThrow();
    expect(() => projectMapDtoSchema.parse(mapResponse([{ ...minimalPoint, box: undefined }]))).toThrow();
  });

  test('maps the project list and defaults missing counts and rights to none', () => {
    const list = projectListDtoSchema.parse({ data: [{ code: 'HRM', name: { vi: 'Nhân sự' }, description: null }] });

    expect(toProjectSummaries(list)).toEqual([
      {
        code: 'HRM',
        name: { vi: 'Nhân sự' },
        description: { vi: null },
        screenCount: 0,
        pointCount: 0,
        myRole: null,
        archivedAt: null,
        permissions: { canEditDesign: false, canEditPlan: false, canManageMembers: false, canEditProject: false, canArchive: false, canDelete: false },
        memberCount: 0,
        managers: [],
      },
    ]);
  });
});
