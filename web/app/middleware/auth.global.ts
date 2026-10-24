import { fetchCurrentUser } from '@/api/auth/auth';
import { loadContentLanguages } from '@/composables/content/useContentLanguages';
import { loadProjectRoles } from '@/composables/project/useProjectRoles';

// Every page except the login page needs a signed-in user; the screen map is internal documentation.
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path.endsWith('/login')) {
    return;
  }

  const user = useCurrentUser();

  if (!user.value) {
    user.value = await fetchCurrentUser().catch(() => null);
  }

  if (!user.value) {
    return navigateTo({ path: useLocalePath()('/login'), query: { redirect: to.fullPath } });
  }

  await Promise.all([
    useState('content-languages', () => []).value.length ? null : loadContentLanguages(),
    useState('project-roles', () => []).value.length ? null : loadProjectRoles(),
  ]);
});
