import { describe, expect, test } from 'vitest';
import { buildEditorContext, buildProjectScreens, buildScreenDetail } from '~~/server/services/screen/screen';
import { DEMO_PROJECTS } from '~~/test/fixtures/screen-map';

function requireProject(code: string) {
  const project = DEMO_PROJECTS.find((item) => item.code === code);

  if (!project) {
    throw new Error(`fixture project ${code} is missing`);
  }

  return project;
}

const learning = requireProject('LMS');

function findPoint(screenCode: string, number: number) {
  const point = buildScreenDetail(learning, screenCode).points.find((item) => item.number === number);

  if (!point) {
    throw new Error(`fixture point ${screenCode}#${number} is missing`);
  }

  return point;
}

describe('screen service', () => {
  test('summarizes the project and lists screens with their point counts', () => {
    const { project, screens } = buildProjectScreens(learning);

    expect(project).toMatchObject({ code: 'LMS', screenCount: 3, pointCount: 13 });
    expect(screens.map((screen) => [screen.code, screen.pointCount])).toEqual([
      ['SC-01', 5],
      ['SC-02', 4],
      ['SC-03', 4],
    ]);
    expect(buildProjectScreens(requireProject('HRM')).screens).toEqual([]);
  });

  test('resolves authored dependencies on other screens, with the point id for editors', () => {
    expect(findPoint('SC-02', 1).dependsOn).toEqual([expect.objectContaining({ pointId: 'SC-01-3', screenCode: 'SC-01', number: 3, reason: 'dependsOn' })]);
  });

  test('derives the reverse direction of a dependency', () => {
    expect(findPoint('SC-01', 3).affects).toContainEqual(expect.objectContaining({ screenCode: 'SC-02', number: 1, reason: 'dependedOnBy' }));
  });

  test('links every point sharing a concept, across screens, with the concept name in both languages', () => {
    const sharedConcept = findPoint('SC-01', 2).affects.filter((link) => link.reason === 'sharedConcept');

    expect(sharedConcept.map((link) => `${link.screenCode}#${link.number}`)).toEqual(['SC-02#1', 'SC-02#3', 'SC-03#1']);
    expect(sharedConcept.every((link) => link.conceptName?.vi === 'Giá khóa học' && link.conceptName.ja === 'コース価格')).toBe(true);
  });

  test('never repeats a dependency link as a concept link or links a point to itself', () => {
    const point = findPoint('SC-02', 3);
    const ids = [...point.dependsOn, ...point.affects].map((link) => `${link.screenCode}#${link.number}`);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('SC-02#3');
  });

  test('resolves concept keys to concepts and keeps design content and ids as authored', () => {
    const point = findPoint('SC-02', 2);

    expect(point.id).toBe('SC-02-2');
    expect(point.concepts.map((concept) => concept.key)).toEqual(['coupon']);
    expect(point.basic.rules[1]?.ja).toBeNull();
  });

  test('rejects an unknown screen as not found', () => {
    expect(() => buildScreenDetail(learning, 'SC-99')).toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
  });

  test('offers every concept and every saved point to the editor', () => {
    const context = buildEditorContext(learning);

    expect(context.concepts.map((concept) => concept.key)).toContain('course-price');
    expect(context.points).toHaveLength(13);
    expect(context.points[0]).toEqual(expect.objectContaining({ id: 'SC-01-1', screenCode: 'SC-01', number: 1 }));
  });
});
