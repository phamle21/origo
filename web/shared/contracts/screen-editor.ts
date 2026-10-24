import type { LocalizedText } from './content';
import type { BusinessConcept, PointBasicDesign, PointDetailDesign, PointHistoryEntry, PointTestCase } from './screen';

/** Bounds shared by the web form, the web server and the API, so a valid form is never rejected later. */
export const SCREEN_EDITOR_LIMITS = {
  maxPoints: 60,
  maxImageBytes: 10 * 1_024 * 1_024,
  imageTypes: ['image/png', 'image/jpeg', 'image/webp'],
  htmlExtensions: ['.html', '.htm', '.zip'],
  maxUrlLength: 2_048,
} as const;

/** Widths the renderer captures HTML and URL sources at; the first is the default. */
export const SCREEN_RENDER_WIDTHS = [1440, 1024, 390] as const;

export type ScreenRenderWidth = (typeof SCREEN_RENDER_WIDTHS)[number];

/** Where a new or replaced screenshot comes from. */
export type ScreenSourceInput =
  | { kind: 'image'; file: File }
  | { kind: 'html'; file: File; width: ScreenRenderWidth }
  | { kind: 'url'; url: string; width: ScreenRenderWidth };

/** One point as saved by the editor; the array order is the numbering, a missing id creates a point. */
export interface PointDraftPayload {
  id: string | null;
  box: [number, number, number, number];
  title: LocalizedText;
  basic: PointBasicDesign;
  detail: PointDetailDesign;
  tests: PointTestCase[];
  history: PointHistoryEntry[];
  concepts: string[];
  /** Ids of saved points on any screen of the project. */
  dependsOn: string[];
}

export interface ScreenTextsPayload {
  name: LocalizedText;
  flow: LocalizedText;
  purpose: LocalizedText;
}

export interface ConceptPayload {
  name: LocalizedText;
  description: LocalizedText;
}

/** A saved point anywhere in the project, offered when choosing what a point depends on. */
export interface PointOption {
  id: string;
  screenCode: string;
  screenName: LocalizedText;
  number: number;
  title: LocalizedText;
}

export interface ScreenEditorContext {
  concepts: BusinessConcept[];
  points: PointOption[];
}
