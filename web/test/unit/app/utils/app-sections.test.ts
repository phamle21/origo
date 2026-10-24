import { describe, expect, test } from 'vitest';
import { isPathWithin, resolveAppSection } from '@/utils/app-sections';

describe('app sections', () => {
  test.each([
    ['/', 'home'],
    ['/ja', 'home'],
    ['/projects', 'projects'],
    ['/p/LMS/plan', 'projects'],
    ['/admin/projects', 'projects'],
    ['/admin/users', 'settings'],
    ['/ja/settings/users/3', 'settings'],
    ['/en/settings/stages', 'settings'],
    ['/profile', 'profile'],
    ['/help', 'help'],
    ['/ja/help/plan-edit', 'help'],
    ['/helpdesk', 'projects'],
  ])('puts %s in the %s app', (path, section) => {
    expect(resolveAppSection(path)).toBe(section);
  });

  test('treats project pages as part of "my projects" but not the admin project list', () => {
    expect(isPathWithin('/ja/p/LMS', '/projects')).toBe(true);
    expect(isPathWithin('/admin/projects', '/projects')).toBe(false);
    expect(isPathWithin('/projects', '/')).toBe(false);
    expect(isPathWithin('/admin/projects/new', '/admin/projects')).toBe(true);
    expect(isPathWithin('/settings/rolesx', '/settings/roles')).toBe(false);
  });
});
