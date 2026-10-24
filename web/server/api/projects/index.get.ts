import { fetchProjectSummaries } from '~~/server/repositories/project/project';
import type { ProjectListItem } from '~~/shared/contracts/project';

export default defineApiHandler((event): Promise<ProjectListItem[]> => fetchProjectSummaries(event));
