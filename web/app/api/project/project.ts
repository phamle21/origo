import { useApiClient } from '@/api/client';
import type { ProjectListItem, UpdateProjectPayload } from '~~/shared/contracts/project';

export function fetchProjectList(): Promise<ProjectListItem[]> {
  return useApiClient()<ProjectListItem[]>('/api/projects');
}

export function updateProjectDetails(code: string, payload: UpdateProjectPayload): Promise<{ code: string }> {
  return useApiClient()<{ code: string }>(`/api/projects/${encodeURIComponent(code)}`, { method: 'PATCH', body: payload });
}

export function archiveProject(code: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/projects/${encodeURIComponent(code)}/archive`, { method: 'POST' });
}

export function unarchiveProject(code: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/projects/${encodeURIComponent(code)}/unarchive`, { method: 'POST' });
}

/** Deletes the project for good; `confirmCode` is what the person typed and must equal the code. */
export function deleteProjectForever(code: string, confirmCode: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/projects/${encodeURIComponent(code)}/forever`, { method: 'DELETE', body: { confirmCode } });
}
