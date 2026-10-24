import { createAppError } from '~~/server/exceptions/app-error';
import type { ProjectRecord, ScreenPointRecord, ScreenRecord } from '~~/server/repositories/project/records';
import { API_ERROR_CODES } from '~~/shared/contracts/api-error';
import type { ProjectSummary } from '~~/shared/contracts/project';
import type { BusinessConcept, PointLink, PointLinkReason, ProjectScreens, ScreenDetail, ScreenPoint, ScreenSummary } from '~~/shared/contracts/screen';
import type { ScreenEditorContext } from '~~/shared/contracts/screen-editor';

interface LocatedPoint {
  screen: ScreenRecord;
  point: ScreenPointRecord;
  /** Position in screen order, used to keep every derived list in reading order. */
  order: number;
}

function toPointId(screenCode: string, number: number): string {
  return `${screenCode}#${number}`;
}

function toScreenSummary(screen: ScreenRecord): ScreenSummary {
  return { code: screen.code, name: screen.name, flow: screen.flow, image: screen.image, pointCount: screen.points.length };
}

function locatePoints(screens: readonly ScreenRecord[]): Map<string, LocatedPoint> {
  const located = new Map<string, LocatedPoint>();

  screens.forEach((screen, screenIndex) => {
    for (const point of screen.points) {
      located.set(toPointId(screen.code, point.number), { screen, point, order: screenIndex * 1_000 + point.number });
    }
  });

  return located;
}

function toLink(target: LocatedPoint, reason: PointLinkReason, concept: BusinessConcept | null = null): PointLink {
  return {
    pointId: target.point.id,
    screenCode: target.screen.code,
    screenName: target.screen.name,
    number: target.point.number,
    title: target.point.title,
    reason,
    conceptName: concept?.name ?? null,
  };
}

/**
 * Links are derived so nobody maintains them twice: `dependsOn` is authored, the reverse direction and
 * every point sharing a business concept are computed. A point already linked by dependency is not
 * repeated as a concept link.
 */
function deriveLinks(
  current: LocatedPoint,
  allPoints: Map<string, LocatedPoint>,
  concepts: Map<string, BusinessConcept>,
): Pick<ScreenPoint, 'dependsOn' | 'affects'> {
  const currentId = toPointId(current.screen.code, current.point.number);
  const byOrder = (a: LocatedPoint, b: LocatedPoint) => a.order - b.order;

  const upstream = current.point.dependsOn.flatMap((id) => allPoints.get(id) ?? []).sort(byOrder);
  const downstream = [...allPoints.values()].filter((candidate) => candidate.point.dependsOn.includes(currentId)).sort(byOrder);
  const linkedIds = new Set([currentId, ...[...upstream, ...downstream].map((item) => toPointId(item.screen.code, item.point.number))]);

  const sharedConcept = [...allPoints.values()]
    .filter((candidate) => !linkedIds.has(toPointId(candidate.screen.code, candidate.point.number)))
    .flatMap((candidate) => {
      const sharedKey = candidate.point.concepts.find((key) => current.point.concepts.includes(key));
      const concept = sharedKey ? concepts.get(sharedKey) : undefined;

      return concept ? [{ candidate, concept }] : [];
    })
    .sort((a, b) => byOrder(a.candidate, b.candidate));

  return {
    dependsOn: upstream.map((item) => toLink(item, 'dependsOn')),
    affects: [
      ...downstream.map((item) => toLink(item, 'dependedOnBy')),
      ...sharedConcept.map(({ candidate, concept }) => toLink(candidate, 'sharedConcept', concept)),
    ],
  };
}

function toProjectSummary(record: ProjectRecord): ProjectSummary {
  return {
    code: record.code,
    name: record.name,
    description: record.description,
    screenCount: record.screens.length,
    pointCount: record.screens.reduce((total, screen) => total + screen.points.length, 0),
    myRole: record.myRole,
    permissions: record.permissions,
    archivedAt: record.archivedAt,
  };
}

export function buildProjectScreens(record: ProjectRecord): ProjectScreens {
  return { project: toProjectSummary(record), screens: record.screens.map(toScreenSummary) };
}

export function buildScreenDetail(record: ProjectRecord, screenCode: string): ScreenDetail {
  const screen = record.screens.find((item) => item.code === screenCode);

  if (!screen) {
    throw createAppError(API_ERROR_CODES.notFound, { internalMessage: `screen ${record.code}/${screenCode} not found` });
  }

  const allPoints = locatePoints(record.screens);
  const conceptsByKey = new Map(record.concepts.map((concept) => [concept.key, concept]));

  return {
    ...toScreenSummary(screen),
    purpose: screen.purpose,
    source: screen.source,
    features: screen.features,
    points: screen.points.map((point) => {
      const located = allPoints.get(toPointId(screen.code, point.number));
      const { concepts: conceptKeys, dependsOn: _authoredDependencies, ...content } = point;

      return {
        ...content,
        concepts: conceptKeys.flatMap((key) => conceptsByKey.get(key) ?? []),
        ...(located ? deriveLinks(located, allPoints, conceptsByKey) : { dependsOn: [], affects: [] }),
      };
    }),
  };
}

/** Everything the editor offers to pick from: the project's concepts and every saved point. */
export function buildEditorContext(record: ProjectRecord): ScreenEditorContext {
  return {
    concepts: record.concepts,
    points: record.screens.flatMap((screen) =>
      screen.points.map((point) => ({ id: point.id, screenCode: screen.code, screenName: screen.name, number: point.number, title: point.title })),
    ),
  };
}
