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
import type { PlanExcelTemplate, PlanStagePayload, StageTemplateEntry, WorkCalendarDay } from '~~/shared/contracts/plan';

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

export function fetchWorkCalendar(): Promise<WorkCalendarDay[]> {
  return useApiClient()<WorkCalendarDay[]>('/api/work-calendar');
}

export function saveWorkCalendar(days: WorkCalendarDay[]): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>('/api/settings/work-calendar', { method: 'PUT', body: { days } });
}

export function fetchPlanTemplate(): Promise<PlanExcelTemplate | null> {
  return useApiClient()<PlanExcelTemplate | null>('/api/settings/plan-template');
}

/** Uploads the team's workbook; `sheet` picks the Gantt sheet when the file holds several. */
export function uploadPlanTemplate(file: File, sheet: string | null): Promise<PlanExcelTemplate | null> {
  const form = new FormData();

  form.append('file', file);
  if (sheet) {
    form.append('sheet', sheet);
  }

  return useApiClient()<PlanExcelTemplate | null>('/api/settings/plan-template', { method: 'POST', body: form });
}

export function deletePlanTemplate(): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>('/api/settings/plan-template', { method: 'DELETE' });
}

export const PLAN_TEMPLATE_FILE_URL = '/api/settings/plan-template/file';
