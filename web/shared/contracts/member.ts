import type { SystemPermission, SystemRoleRef } from './access';
import type { LocalizedText } from './content';
import type { ProjectRole } from './project';

export interface UserOption {
  id: number;
  name: string;
  email: string;
  title: string | null;
  initials: string;
}

export interface ProjectMember {
  id: string;
  role: ProjectRole;
  user: UserOption & { isActive: boolean };
}

export interface AdminUser extends UserOption {
  isAdmin: boolean;
  permissions: SystemPermission[];
  systemRole: SystemRoleRef | null;
  isActive: boolean;
  /** Number of projects the person belongs to. */
  projectCount: number;
}

/** One project a person belongs to, seen from the admin's person page. */
export interface UserMembership {
  memberId: string;
  role: ProjectRole;
  project: { code: string; name: LocalizedText };
}

export interface CreateAccountPayload {
  name: string;
  email: string;
  title: string | null;
  /** Defaults to the built-in member role. */
  systemRoleId: string | null;
}

export interface UpdateAccountPayload {
  name?: string;
  email?: string;
  title?: string | null;
  systemRoleId?: string;
  isActive?: boolean;
}

/** A new account or a reset password: the temporary password is shown once and never stored here. */
export interface IssuedPassword {
  user?: AdminUser;
  temporaryPassword: string;
}
