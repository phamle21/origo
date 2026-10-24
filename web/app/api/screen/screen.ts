import { useApiClient } from '@/api/client';
import type { BusinessConcept, PointComment, ProjectScreens, ScreenDetail } from '~~/shared/contracts/screen';
import { appendScreenSource } from '@/utils/screen-source';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { ConceptPayload, PointDraftPayload, ScreenEditorContext, ScreenSourceInput, ScreenTextsPayload } from '~~/shared/contracts/screen-editor';

export function fetchProjectScreens(projectCode: string): Promise<ProjectScreens> {
  return useApiClient()<ProjectScreens>(`/api/projects/${encodeURIComponent(projectCode)}/screens`);
}

export function fetchScreenDetail(projectCode: string, screenCode: string): Promise<ScreenDetail> {
  return useApiClient()<ScreenDetail>(`/api/projects/${encodeURIComponent(projectCode)}/screens/${encodeURIComponent(screenCode)}`);
}

export function fetchEditorContext(projectCode: string): Promise<ScreenEditorContext> {
  return useApiClient()<ScreenEditorContext>(`/api/projects/${encodeURIComponent(projectCode)}/editor-context`);
}

function toScreenFormData(texts: ScreenTextsPayload | null, source: ScreenSourceInput): FormData {
  const form = new FormData();

  const fields: [string, LocalizedText][] = texts ? Object.entries(texts) : [];

  // One part per field and language, e.g. `name.vi`, `name.ja`, `name.en`.
  for (const [field, value] of fields) {
    for (const [locale, text] of Object.entries(value)) {
      form.append(`${field}.${locale}`, text ?? '');
    }
  }

  return appendScreenSource(form, source);
}

export function createScreen(projectCode: string, texts: ScreenTextsPayload, source: ScreenSourceInput): Promise<{ code: string }> {
  return useApiClient()<{ code: string }>(`/api/projects/${encodeURIComponent(projectCode)}/screens`, {
    method: 'POST',
    body: toScreenFormData(texts, source),
  });
}

export function updateScreenTexts(projectCode: string, screenCode: string, texts: ScreenTextsPayload): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/projects/${encodeURIComponent(projectCode)}/screens/${encodeURIComponent(screenCode)}`, {
    method: 'PATCH',
    body: texts,
  });
}

export function replaceScreenSource(projectCode: string, screenCode: string, source: ScreenSourceInput): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/projects/${encodeURIComponent(projectCode)}/screens/${encodeURIComponent(screenCode)}/image`, {
    method: 'POST',
    body: toScreenFormData(null, source),
  });
}

export function recaptureScreen(projectCode: string, screenCode: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/projects/${encodeURIComponent(projectCode)}/screens/${encodeURIComponent(screenCode)}/recapture`, {
    method: 'POST',
  });
}

export function deleteScreen(projectCode: string, screenCode: string): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/projects/${encodeURIComponent(projectCode)}/screens/${encodeURIComponent(screenCode)}`, { method: 'DELETE' });
}

export function saveScreenPoints(projectCode: string, screenCode: string, points: PointDraftPayload[]): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>(`/api/projects/${encodeURIComponent(projectCode)}/screens/${encodeURIComponent(screenCode)}/points`, {
    method: 'PUT',
    body: { points },
  });
}

export function createConcept(projectCode: string, concept: ConceptPayload): Promise<BusinessConcept> {
  return useApiClient()<BusinessConcept>(`/api/projects/${encodeURIComponent(projectCode)}/concepts`, { method: 'POST', body: concept });
}

export function postPointComment(projectCode: string, pointId: string, text: string, mentionIds: number[] = []): Promise<PointComment> {
  return useApiClient()<PointComment>(`/api/projects/${encodeURIComponent(projectCode)}/points/${encodeURIComponent(pointId)}/comments`, {
    method: 'POST',
    body: { text, mentionIds },
  });
}
