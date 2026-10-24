import type { SystemPermission } from '~~/shared/contracts/access';

/**
 * Checks the signed-in person's system permissions, to show or hide whole areas. The API enforces the
 * same rules, so this only keeps people from seeing links they cannot use.
 */
export function useSystemAccess() {
  const currentUser = useCurrentUser();

  function can(...permissions: SystemPermission[]): boolean {
    return permissions.some((permission) => Boolean(currentUser.value?.permissions.includes(permission)));
  }

  return {
    can,
    canManageUsers: computed(() => can('users.manage')),
    canManageSettings: computed(() => can('settings.manage')),
    canCreateProjects: computed(() => can('projects.create')),
    canSeeAllProjects: computed(() => can('projects.view_all', 'projects.manage_all')),
    canOpenSettings: computed(() => can('users.manage', 'settings.manage')),
  };
}
