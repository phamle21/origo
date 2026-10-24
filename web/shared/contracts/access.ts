import type { LocalizedText } from './content';

/** System permissions, granted through a system role; the API decides, the web hides what is not allowed. */
export const SYSTEM_PERMISSIONS = ['users.manage', 'settings.manage', 'projects.create', 'projects.view_all', 'projects.manage_all'] as const;

export type SystemPermission = (typeof SYSTEM_PERMISSIONS)[number];

/** Project permissions, granted through a project role. `project.read` comes first: every other one needs it. */
export const PROJECT_PERMISSIONS = ['project.read', 'plan.edit', 'design.edit', 'members.manage', 'project.edit'] as const;

export type ProjectPermission = (typeof PROJECT_PERMISSIONS)[number];

export const PERMISSION_SCOPES = ['system', 'project'] as const;

export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

/** The groups each scope sorts its permissions into (labels come from i18n). */
export const PERMISSION_GROUPS = {
  system: ['people', 'system', 'projects'],
  project: ['reading', 'plan', 'design', 'team'],
} as const satisfies Record<PermissionScope, readonly string[]>;

/** One permission of the catalog: the key code checks is fixed; name, description, group and order are editable. */
export interface PermissionEntry {
  id: string;
  key: string;
  group: string;
  name: LocalizedText;
  description: LocalizedText;
  position: number;
}

export interface PermissionPayload {
  name: LocalizedText;
  description: LocalizedText;
  group: string;
  position: number;
}

export interface SystemRoleRef {
  id: string;
  key: string;
  name: LocalizedText;
}

export interface SystemRole extends SystemRoleRef {
  description: LocalizedText;
  permissions: SystemPermission[];
  /** The role new accounts get; exactly one role has it. */
  isDefault: boolean;
  userCount: number;
}

export interface SystemRolePayload {
  name: LocalizedText;
  description: LocalizedText;
  permissions: SystemPermission[];
  isDefault: boolean;
}

/** A role people hold inside a project; members point at it by `key`. */
export interface ProjectRoleOption {
  id: string;
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  permissions: ProjectPermission[];
  memberCount: number;
}

export interface ProjectRolePayload {
  name: LocalizedText;
  description: LocalizedText;
  permissions: ProjectPermission[];
}
