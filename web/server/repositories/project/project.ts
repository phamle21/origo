import type { H3Event } from 'h3';
import { createOrigoApiClient } from '~~/server/integrations/origo-api/client';
import { projectListDtoSchema, projectMapDtoSchema } from '~~/server/integrations/origo-api/dto/screen-map.dto';
import { toProjectRecord, toProjectSummaries } from '~~/server/integrations/origo-api/mappers/screen-map';
import type { ProjectListItem } from '~~/shared/contracts/project';
import type { ProjectRecord } from './records';

/** At most this many projects are listed; the API paginates beyond it. */
const PROJECT_LIST_LIMIT = 100;

export async function fetchProjectSummaries(event: H3Event): Promise<ProjectListItem[]> {
  const response = await createOrigoApiClient(event)('/projects', { query: { per_page: PROJECT_LIST_LIMIT } });

  return toProjectSummaries(projectListDtoSchema.parse(response));
}

/** The whole screen map of one project; parsing precedes mapping so a broken contract fails upstream. */
export async function fetchProjectRecord(event: H3Event, code: string): Promise<ProjectRecord> {
  const response = await createOrigoApiClient(event)(`/projects/${encodeURIComponent(code)}/map`);

  return toProjectRecord(projectMapDtoSchema.parse(response));
}
