import type { SystemPermission, SystemRoleRef } from './access';

export interface CurrentUser {
  name: string;
  email: string;
  /** Job title shown next to comments, e.g. "BA". */
  title: string | null;
  initials: string;
  /** Holder of the built-in admin role. Prefer checking `permissions`. */
  isAdmin: boolean;
  /** System permissions from the person's system role; project rights come from each project role. */
  permissions: SystemPermission[];
  systemRole: SystemRoleRef | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}
