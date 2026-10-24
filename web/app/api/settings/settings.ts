import { useApiClient } from '@/api/client';
import type {
  PermissionEntry,
  PermissionPayload,
  PermissionScope,
  ProjectRoleOption,
  ProjectRolePayload,
  SystemRole,
  SystemRolePayload,
} from '~~/shared/contracts/access';
import type { PlanStagePayload, StageTemplateEntry } from '~~/shared/contracts/plan';

export function fetchStageTemplate(): Promise<StageTemplateEntry[]> {
  return useApiClient()<StageTemplateEntry[]>('/api/settings/stage-template');
}

export function saveStageTemplate(stages: PlanStagePayload[]): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>('/api/settings/stage-template', { method: 'PUT', body: { stages } });
}

export function fetchSystemRoles(): Promise<SystemRole[]> {
  return useApiClient()<SystemRole[]>('/api/settings/system-roles');
}

export function createSystemRole(payload: SystemRolePayload): Promise<SystemRole> {
  return useApiClient()<SystemRole>('/api/settings/system-roles', { method: 'POST', body: payload });
}

export function updateSystemRole(roleId: string, payload: SystemRolePayload): Promise<SystemRole> {
  return useApiClient()<SystemRole>(`/api/settings/system-roles/${encodeURIComponent(roleId)}`, { method: 'PATCH', body: payload });
}

export function deleteSystemRole(roleId: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/settings/system-roles/${encodeURIComponent(roleId)}`, { method: 'DELETE' });
}

export function fetchProjectRoles(): Promise<ProjectRoleOption[]> {
  return useApiClient()<ProjectRoleOption[]>('/api/project-roles');
}

export function createProjectRole(payload: ProjectRolePayload): Promise<ProjectRoleOption> {
  return useApiClient()<ProjectRoleOption>('/api/settings/project-roles', { method: 'POST', body: payload });
}

export function updateProjectRole(roleId: string, payload: ProjectRolePayload): Promise<ProjectRoleOption> {
  return useApiClient()<ProjectRoleOption>(`/api/settings/project-roles/${encodeURIComponent(roleId)}`, { method: 'PATCH', body: payload });
}

export function deleteProjectRole(roleId: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/settings/project-roles/${encodeURIComponent(roleId)}`, { method: 'DELETE' });
}

export function fetchPermissions(scope: PermissionScope): Promise<PermissionEntry[]> {
  return useApiClient()<PermissionEntry[]>(`/api/permissions/${scope}`);
}

export function updatePermission(scope: PermissionScope, permissionId: string, payload: PermissionPayload): Promise<PermissionEntry> {
  return useApiClient()<PermissionEntry>(`/api/settings/permissions/${scope}/${encodeURIComponent(permissionId)}`, { method: 'PATCH', body: payload });
}
