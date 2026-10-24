import { useApiClient } from '@/api/client';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { PlanItemKind, PlanStagePayload, PlanTaskPayload, ProjectPlan } from '~~/shared/contracts/plan';

function planPath(projectCode: string, path = ''): string {
  return `/api/projects/${encodeURIComponent(projectCode)}/plan${path}`;
}

function itemPath(projectCode: string, itemId: string, path = ''): string {
  return planPath(projectCode, `/items/${encodeURIComponent(itemId)}${path}`);
}

export function fetchProjectPlan(projectCode: string): Promise<ProjectPlan> {
  return useApiClient()<ProjectPlan>(planPath(projectCode));
}

export function savePlanStages(projectCode: string, stages: PlanStagePayload[]): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(planPath(projectCode, '/stages'), { method: 'PUT', body: { stages } });
}

export function createPlanItem(projectCode: string, kind: PlanItemKind, parentId: string | null, name: LocalizedText): Promise<{ id: string }> {
  return useApiClient()<{ id: string }>(planPath(projectCode, '/items'), { method: 'POST', body: { kind, parentId, name } });
}

export function updatePlanItem(
  projectCode: string,
  itemId: string,
  change: { name?: LocalizedText; note?: string | null; move?: 'up' | 'down'; parentId?: string | null; position?: number },
): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(itemPath(projectCode, itemId), { method: 'PATCH', body: change });
}

export function deletePlanItem(projectCode: string, itemId: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(itemPath(projectCode, itemId), { method: 'DELETE' });
}

export function linkPlanItemScreens(projectCode: string, itemId: string, screenCodes: string[]): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(itemPath(projectCode, itemId, '/screens'), { method: 'PUT', body: { screenCodes } });
}

export function savePlanTask(projectCode: string, itemId: string, stageId: string, task: PlanTaskPayload): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(itemPath(projectCode, itemId, `/tasks/${encodeURIComponent(stageId)}`), { method: 'PUT', body: task });
}

export function deletePlanTask(projectCode: string, itemId: string, stageId: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(itemPath(projectCode, itemId, `/tasks/${encodeURIComponent(stageId)}`), { method: 'DELETE' });
}
