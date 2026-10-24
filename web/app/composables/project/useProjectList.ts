import { fetchProjectList } from '@/api/project/project';

export function useProjectList() {
  return useRouteResource('project-list', () => fetchProjectList());
}
