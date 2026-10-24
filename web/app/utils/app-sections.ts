/**
 * Origo is split into a few "apps", opened from the home grid or the launcher in the top bar, each with
 * its own pages: projects (everyone), settings (people, roles and defaults, for those allowed) and the
 * illustrated user guide (everyone). The
 * home grid and the profile belong to no app.
 */
export const APP_SECTIONS = ['home', 'projects', 'settings', 'help', 'profile'] as const;

export type AppSection = (typeof APP_SECTIONS)[number];

/** Works on any locale-prefixed path such as `/ja/settings/users/3`. */
export function resolveAppSection(path: string): AppSection {
  const bare = path.replace(/^\/(ja|en)(?=\/|$)/, '') || '/';

  if (bare.startsWith('/settings') || bare.startsWith('/admin/users')) {
    return 'settings';
  }
  if (bare === '/help' || bare.startsWith('/help/')) {
    return 'help';
  }
  if (bare.startsWith('/profile')) {
    return 'profile';
  }
  if (bare === '/') {
    return 'home';
  }

  return 'projects';
}

/** Whether `path` is `target` or a page below it, ignoring the locale prefix. */
export function isPathWithin(path: string, target: string): boolean {
  const bare = path.replace(/^\/(ja|en)(?=\/|$)/, '') || '/';

  // Project pages live under `/p/<code>` but belong to the project list.
  if (target === '/projects' && bare.startsWith('/p/')) {
    return true;
  }

  return bare === target || (target !== '/' && bare.startsWith(`${target}/`));
}
