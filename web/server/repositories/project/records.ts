import type { LocalizedText } from '~~/shared/contracts/content';
import type { ProjectPermissions, ProjectRole } from '~~/shared/contracts/project';
import type {
  BusinessConcept,
  PointBasicDesign,
  PointComment,
  PointDetailDesign,
  PointHistoryEntry,
  PointTestCase,
  ScreenImage,
  ScreenImageSource,
} from '~~/shared/contracts/screen';

/**
 * The screen map of one project as stored: only facts. Reverse dependencies, shared-concept links and
 * counts are derived by the services.
 */
export interface ScreenPointRecord {
  id: string;
  number: number;
  title: LocalizedText;
  box: [number, number, number, number];
  basic: PointBasicDesign;
  detail: PointDetailDesign;
  tests: PointTestCase[];
  /** Keys of the business concepts the point uses. */
  concepts: string[];
  /** Points this one needs, as `SC-01#2`. */
  dependsOn: string[];
  history: PointHistoryEntry[];
  comments: PointComment[];
}

export interface ScreenRecord {
  id: string;
  code: string;
  name: LocalizedText;
  flow: LocalizedText;
  purpose: LocalizedText;
  image: ScreenImage;
  source: ScreenImageSource;
  features: { id: string; name: LocalizedText }[];
  points: ScreenPointRecord[];
}

export interface ProjectRecord {
  code: string;
  name: LocalizedText;
  description: LocalizedText;
  myRole: ProjectRole | null;
  permissions: ProjectPermissions;
  archivedAt: string | null;
  concepts: BusinessConcept[];
  screens: ScreenRecord[];
}
