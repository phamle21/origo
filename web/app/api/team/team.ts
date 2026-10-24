import { useApiClient } from '@/api/client';
import type {
  AdminUser,
  CreateAccountPayload,
  IssuedPassword,
  ProjectMember,
  UpdateAccountPayload,
  UserMembership,
  UserOption,
} from '~~/shared/contracts/member';
import type { CreateProjectPayload, ProjectRole } from '~~/shared/contracts/project';

function membersPath(projectCode: string): string {
  return `/api/projects/${encodeURIComponent(projectCode)}/members`;
}

export function fetchProjectMembers(projectCode: string): Promise<ProjectMember[]> {
  return useApiClient()<ProjectMember[]>(membersPath(projectCode));
}

export function addProjectMember(projectCode: string, userId: number, role: ProjectRole): Promise<ProjectMember> {
  return useApiClient()<ProjectMember>(membersPath(projectCode), { method: 'POST', body: { userId, role } });
}

export function changeProjectMemberRole(projectCode: string, memberId: string, role: ProjectRole): Promise<ProjectMember> {
  return useApiClient()<ProjectMember>(`${membersPath(projectCode)}/${encodeURIComponent(memberId)}`, { method: 'PATCH', body: { role } });
}

export function removeProjectMember(projectCode: string, memberId: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`${membersPath(projectCode)}/${encodeURIComponent(memberId)}`, { method: 'DELETE' });
}

export function lookupUsers(query: string): Promise<UserOption[]> {
  return useApiClient()<UserOption[]>('/api/users/lookup', { query: { q: query } });
}

export function fetchAdminUsers(query = ''): Promise<AdminUser[]> {
  return useApiClient()<AdminUser[]>('/api/admin/users', { query: query ? { q: query } : {} });
}

export function fetchAdminUser(userId: number): Promise<AdminUser> {
  return useApiClient()<AdminUser>(`/api/admin/users/${userId}`);
}

export function fetchUserMemberships(userId: number): Promise<UserMembership[]> {
  return useApiClient()<UserMembership[]>(`/api/admin/users/${userId}/projects`);
}

export function createAccount(payload: CreateAccountPayload): Promise<IssuedPassword> {
  return useApiClient()<IssuedPassword>('/api/admin/users', { method: 'POST', body: payload });
}

export function updateAccount(userId: number, payload: UpdateAccountPayload): Promise<AdminUser> {
  return useApiClient()<AdminUser>(`/api/admin/users/${userId}`, { method: 'PATCH', body: payload });
}

export function resetAccountPassword(userId: number): Promise<IssuedPassword> {
  return useApiClient()<IssuedPassword>(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
}

export function createProject(payload: CreateProjectPayload): Promise<{ code: string }> {
  return useApiClient()<{ code: string }>('/api/projects', { method: 'POST', body: payload });
}
