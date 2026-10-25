import type { LocalizedText } from './content';

export type PlanItemKind = 'phase' | 'module' | 'feature';

/** The category of a task's status; the chart colours and the progress figures rely on it. */
export type PlanTaskStatus = 'todo' | 'doing' | 'done';

export interface PlanStage {
  id: string;
  key: string;
  name: LocalizedText;
  /** `#rrggbb`. */
  color: string;
  /** The window agreed for the whole stage (`YYYY-MM-DD`), if set. */
  startDate: string | null;
  endDate: string | null;
  /** The side responsible for the stage, e.g. "VN", "JP" or the customer. */
  owner: string | null;
}

/** A status the project names itself (e.g. "Checking"), within one category. */
export interface PlanStatus {
  id: string;
  name: LocalizedText;
  category: PlanTaskStatus;
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
  /** 1 (highest) to 5, shown as P1–P5. */
  priority: number | null;
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
  /** The project status shown for the task; always one of `ProjectPlan.statuses` in `status`'s category. */
  statusId: string | null;
  assigneeId: number | null;
  /** Planned effort in man-days. */
  estimateDays: number | null;
  /** Share finished, 0–100; a done task counts as 100 whatever this says. */
  progress: number | null;
  link: string | null;
  note: string | null;
}

/** Effort figures in man-days; progress is 0–1, weighed by effort or, without estimates, by task count. */
export interface PlanEffort {
  estimateDays: number;
  actualDays: number;
  remainingDays: number;
  progress: number | null;
  basis: 'effort' | 'count';
}

export interface PlanStageSummary extends PlanEffort {
  stageId: string;
  owner: string | null;
  startDate: string | null;
  endDate: string | null;
  workingDays: number | null;
  /** The stage's end has passed while some of its tasks are not done. */
  isLate: boolean;
}

export interface PlanSummary {
  today: string;
  overall: PlanEffort & {
    startDate: string | null;
    endDate: string | null;
    workingDays: number | null;
    workingDaysPassed: number | null;
    /** Working days passed / working days in the plan, 0–1. */
    timeElapsed: number | null;
    taskCount: number;
    doneCount: number;
  };
  stages: PlanStageSummary[];
}

export interface ProjectPlan {
  canEdit: boolean;
  stages: PlanStage[];
  statuses: PlanStatus[];
  items: PlanItem[];
  tasks: PlanTask[];
  summary: PlanSummary;
}

/** Fields left out keep their saved value, so moving a bar does not wipe its estimate or note. */
export interface PlanTaskPayload {
  startDate: string;
  endDate: string;
  status?: PlanTaskStatus;
  statusId?: string | null;
  assigneeId: number | null;
  estimateDays?: number | null;
  progress?: number | null;
  link?: string | null;
  note?: string | null;
}

export interface PlanStagePayload {
  id: string | null;
  name: LocalizedText;
  color: string;
  startDate?: string | null;
  endDate?: string | null;
  owner?: string | null;
}

export interface PlanStatusPayload {
  id: string | null;
  name: LocalizedText;
  category: PlanTaskStatus;
  color: string;
}

/** One stage of the system-wide list new projects start from. */
export interface StageTemplateEntry {
  key: string;
  name: LocalizedText;
  color: string;
}

/** The figures a week froze when it was recorded. */
export interface PlanWeekSnapshot {
  overall: PlanEffort & { timeElapsed: number | null; doneCount: number; taskCount: number };
  stages: (PlanEffort & { stageId: string; name: LocalizedText })[];
}

export interface PlanWeek {
  /** Monday of the week, `YYYY-MM-DD`. */
  weekStart: string;
  snapshot: PlanWeekSnapshot | null;
  /** ISO time the figures were frozen. */
  snapshotAt: string | null;
  summary: LocalizedText | null;
  /** Hours by member id. */
  hours: Record<string, number>;
}

export interface PlanWeeklyReport {
  canEdit: boolean;
  currentWeek: string;
  members: { id: number; name: string; title: string | null }[];
  weeks: PlanWeek[];
}

export interface PlanWeekPayload {
  summary?: LocalizedText | null;
  hours?: Record<string, number | null>;
}

/** An exception to the Monday–Friday week. */
export interface WorkCalendarDay {
  date: string;
  kind: 'holiday' | 'workday';
  name: string | null;
}

/** The team's project-management workbook that exports are filled into. */
export interface PlanExcelTemplate {
  originalName: string;
  uploadedAt: string;
  uploadedBy: { id: number; name: string };
  /** The sheet laid out as the Gantt chart, and the other sheets it could have been. */
  ganttSheet: string;
  candidates: string[];
  weeklySheet: string | null;
  warnings: string[];
}
