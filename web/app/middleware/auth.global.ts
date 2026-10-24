import { fetchCurrentUser } from '@/api/auth/auth';
import { fetchInstallStatus } from '@/api/install/install';
import { loadContentLanguages } from '@/composables/content/useContentLanguages';
import { loadProjectRoles } from '@/composables/project/useProjectRoles';

// Every page except login and install needs a signed-in user; the screen map is internal documentation.
// Before the first administrator exists, signed-out visitors are sent to the install screen instead.
export default defineNuxtRouteMiddleware(async (to) => {
  const isPath = (name: string) => to.path === `/${name}` || to.path.endsWith(`/${name}`);

  if (isPath('install')) {
    return;
  }

  const user = useCurrentUser();

  if (!user.value) {
    user.value = await fetchCurrentUser().catch(() => null);
  }

  if (user.value) {
    if (isPath('login')) {
      return;
    }
  } else {
    const status = await fetchInstallStatus().catch(() => null);

    if (status && !status.isInstalled) {
      return navigateTo(useLocalePath()('/install'));
    }

    if (isPath('login')) {
      return;
    }

    return navigateTo({ path: useLocalePath()('/login'), query: { redirect: to.fullPath } });
  }

  await Promise.all([
    useState('content-languages', () => []).value.length ? null : loadContentLanguages(),
    useState('project-roles', () => []).value.length ? null : loadProjectRoles(),
  ]);
});
