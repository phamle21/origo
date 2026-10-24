import type { LocalizedText } from './content';

/** The key of a project role. Roles are created by admins (Settings → Project roles), so any key is possible. */
export type ProjectRole = string;

/** What the signed-in person may do in one project; the API decides, the web only shows matching actions. */
export interface ProjectPermissions {
  canEditDesign: boolean;
  canEditPlan: boolean;
  canManageMembers: boolean;
  /** Rename the project or change its description (managers and project admins). */
  canEditProject: boolean;
  /** Archive the project or bring it back. */
  canArchive: boolean;
  /** Delete the project and everything in it for good (people who manage every project). */
  canDelete: boolean;
}

export interface ProjectSummary {
  code: string;
  name: LocalizedText;
  description: LocalizedText;
  screenCount: number;
  pointCount: number;
  /** Null for an admin who is not a member of the project. */
  myRole: ProjectRole | null;
  permissions: ProjectPermissions;
  /** ISO-8601 time the project was archived (read-only since), or null while it is active. */
  archivedAt: string | null;
}

/** A project as the project list shows it: who runs it and how big the team is. */
export interface ProjectListItem extends ProjectSummary {
  memberCount: number;
  managers: { id: number; name: string; initials: string }[];
}

export interface CreateProjectPayload {
  code: string;
  name: LocalizedText;
  description: LocalizedText;
  managerId: number | null;
}

/** What can be changed after a project is created; the code is fixed because links use it. */
export interface UpdateProjectPayload {
  name: LocalizedText;
  description: LocalizedText;
}
