export const THEME_MODES = ['light', 'dark', 'system'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

/**
 * The reader's colour theme, kept in a cookie so the server renders the right `data-theme` and the
 * page never flashes the other theme. "system" follows the device setting through CSS.
 */
export function useThemeMode() {
  const cookie = useCookie<ThemeMode>('origo-theme', { default: () => 'system', sameSite: 'lax', maxAge: 31_536_000 });
  const theme = computed<ThemeMode>({
    get: () => (THEME_MODES.includes(cookie.value) ? cookie.value : 'system'),
    set: (value) => {
      cookie.value = value;
    },
  });

  return { theme };
}
