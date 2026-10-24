// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { useCurrentUser } from '@/composables/auth/useCurrentUser';
import { useApps } from '@/composables/useApps';
import type { SystemPermission } from '~~/shared/contracts/access';
import { withSetup } from './with-setup';

function signInWith(permissions: SystemPermission[]) {
  useCurrentUser().value = { name: 'Lan', email: 'lan@origo.local', title: null, initials: 'L', isAdmin: false, permissions, systemRole: null };
}

describe('useApps', () => {
  test('shows projects and the guide to a plain member', async () => {
    signInWith([]);

    expect((await withSetup(() => useApps())).value.map((app) => app.id)).toEqual(['projects', 'help']);
  });

  test('adds settings for someone who manages people or settings', async () => {
    signInWith(['settings.manage']);

    expect((await withSetup(() => useApps())).value.map((app) => [app.id, app.to])).toEqual([
      ['projects', '/projects'],
      ['settings', '/settings'],
      ['help', '/help'],
    ]);
  });
});
