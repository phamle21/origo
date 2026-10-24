import type { LocalizedText } from './content';

export type PlanItemKind = 'phase' | 'module' | 'feature';

export type PlanTaskStatus = 'todo' | 'doing' | 'done';

export interface PlanStage {
  id: string;
  key: string;
  name: LocalizedText;
  /** `#rrggbb`. */
  color: string;
}

export interface PlanItem {
  id: string;
  parentId: string | null;
  kind: PlanItemKind;
  name: LocalizedText;
  /** Free-text team note, shown as a tooltip on the feature in the chart. */
  note: string | null;
  position: number;
  /** Design screens describing this feature. */
  screenCodes: string[];
}

export interface PlanTask {
  id: string;
  itemId: string;
  stageId: string;
  /** `YYYY-MM-DD`, inclusive. */
  startDate: string;
  endDate: string;
  status: PlanTaskStatus;
  assigneeId: number | null;
}

export interface ProjectPlan {
  canEdit: boolean;
  stages: PlanStage[];
  items: PlanItem[];
  tasks: PlanTask[];
}

export interface PlanTaskPayload {
  startDate: string;
  endDate: string;
  status: PlanTaskStatus;
  assigneeId: number | null;
}

export interface PlanStagePayload {
  id: string | null;
  name: LocalizedText;
  color: string;
}

/** One stage of the system-wide list new projects start from. */
export interface StageTemplateEntry {
  key: string;
  name: LocalizedText;
  color: string;
}
