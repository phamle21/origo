import type { LocalizedText } from './content';
import type { ProjectSummary } from './project';

/** Screenshot of a screen, served from `public/`, with its intrinsic size in CSS pixels. */
export interface ScreenImage {
  src: string;
  width: number;
  height: number;
}

/** Where the screenshot came from; HTML and URL sources can be captured again at the same width. */
export interface ScreenImageSource {
  kind: 'image' | 'html' | 'url';
  url: string | null;
  width: number | null;
}

export interface ScreenSummary {
  code: string;
  name: LocalizedText;
  /** The user flow the screen belongs to, used to group the screen list. */
  flow: LocalizedText;
  image: ScreenImage;
  pointCount: number;
}

export interface ProjectScreens {
  project: ProjectSummary;
  screens: ScreenSummary[];
}

/** A business concept shared by several points, e.g. the course price. Impacts are derived from it. */
export interface BusinessConcept {
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  /** Places outside the mapped screens that also use the concept, such as stored orders or reports. */
  alsoUsedIn: LocalizedText[];
}

/** Basic design (基本設計): what the reader sees and the business rules, for BA, PO and the customer. */
export interface PointBasicDesign {
  summary: LocalizedText;
  rules: LocalizedText[];
}

/** One row of the detail design (詳細設計): an item and its specification, for developers. */
export interface PointDetailRow {
  item: LocalizedText;
  spec: LocalizedText;
}

export interface PointDetailDesign {
  rows: PointDetailRow[];
  /** Endpoints are identifiers, so they are not translated. */
  endpoints: string[];
}

/** One test viewpoint (テスト観点) written as Given / When / Then, for QA. */
export interface PointTestCase {
  given: LocalizedText;
  when: LocalizedText;
  then: LocalizedText;
}

export type PointLinkReason = 'dependsOn' | 'dependedOnBy' | 'sharedConcept';

/** Another numbered point, on this or another screen, and why it is linked. */
export interface PointLink {
  pointId: string;
  screenCode: string;
  screenName: LocalizedText;
  number: number;
  title: LocalizedText;
  reason: PointLinkReason;
  /** The shared concept when `reason` is `sharedConcept`. */
  conceptName: LocalizedText | null;
}

export interface PointHistoryEntry {
  phase: string;
  note: LocalizedText;
}

export interface PointComment {
  id: string;
  authorInitials: string;
  author: string;
  role: string;
  /** Comments are kept in the language they were written in. */
  text: string;
  /** ISO-8601 timestamp. */
  at: string;
  /** People tagged with @ in the text. */
  mentions: { id: number; name: string }[];
}

export interface ScreenPoint {
  id: string;
  number: number;
  title: LocalizedText;
  /** Highlight box in percent of the image: left, top, width, height. */
  box: [number, number, number, number];
  basic: PointBasicDesign;
  detail: PointDetailDesign;
  tests: PointTestCase[];
  concepts: BusinessConcept[];
  dependsOn: PointLink[];
  affects: PointLink[];
  history: PointHistoryEntry[];
  comments: PointComment[];
}

export interface ScreenDetail extends ScreenSummary {
  purpose: LocalizedText;
  source: ScreenImageSource;
  /** Planned features this screen belongs to. */
  features: { id: string; name: LocalizedText }[];
  points: ScreenPoint[];
}
