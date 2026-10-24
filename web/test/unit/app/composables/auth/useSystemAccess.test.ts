// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { useCurrentUser } from '@/composables/auth/useCurrentUser';
import { useSystemAccess } from '@/composables/auth/useSystemAccess';
import type { SystemPermission } from '~~/shared/contracts/access';

function signInWith(permissions: SystemPermission[]) {
  useCurrentUser().value = { name: 'Lan', email: 'lan@origo.local', title: null, initials: 'L', isAdmin: false, permissions, systemRole: null };
}

describe('useSystemAccess', () => {
  test('opens settings for either people or settings rights', () => {
    signInWith(['users.manage']);
    const access = useSystemAccess();

    expect(access.canOpenSettings.value).toBe(true);
    expect(access.canManageSettings.value).toBe(false);
    expect(access.canSeeAllProjects.value).toBe(false);
  });

  test('treats "manage all projects" as seeing them all', () => {
    signInWith(['projects.manage_all']);

    expect(useSystemAccess().canSeeAllProjects.value).toBe(true);
    expect(useSystemAccess().canOpenSettings.value).toBe(false);
  });

  test('allows nothing when signed out', () => {
    useCurrentUser().value = null;

    expect(useSystemAccess().can('projects.create')).toBe(false);
  });
});
