import type { AppTileIconName } from '@/components/ui/AppTileIcon.vue';
import type { AppSection } from '@/utils/app-sections';

export interface OrigoApp {
  id: Exclude<AppSection, 'home' | 'profile'>;
  label: string;
  description: string;
  tile: AppTileIconName;
  to: string;
}

/**
 * The apps a person may open, in launcher order. The home page grid and the top-bar launcher both read
 * this list, so a new module is added here once and appears in both places.
 */
export function useApps() {
  const { t } = useI18n();
  const localePath = useLocalePath();
  const access = useSystemAccess();

  return computed<OrigoApp[]>(() => {
    const apps: (OrigoApp & { isShown: boolean })[] = [
      {
        id: 'projects',
        label: t('layout.apps.projects'),
        description: t('home.apps.projects'),
        tile: 'projects',
        to: localePath('/projects'),
        isShown: true,
      },
      {
        id: 'settings',
        label: t('layout.apps.settings'),
        description: t('home.apps.settings'),
        tile: 'settings',
        to: localePath('/settings'),
        isShown: access.canOpenSettings.value,
      },
      {
        id: 'help',
        label: t('layout.apps.help'),
        description: t('home.apps.help'),
        tile: 'help',
        to: localePath('/help'),
        isShown: true,
      },
    ];

    return apps.filter((app) => app.isShown).map(({ isShown: _isShown, ...app }) => app);
  });
}
