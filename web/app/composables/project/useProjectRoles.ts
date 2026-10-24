import { fetchProjectRoles } from '@/api/settings/settings';
import { resolveLocalizedText } from '@/utils/content-language';
import type { ProjectRoleOption } from '~~/shared/contracts/access';

/**
 * The project roles admins created, in display order. Loaded once per visit by the auth middleware
 * and shared through hydration; badges, member lists and plan hints read names from here.
 */
export function useProjectRoles() {
  const roles = useState<ProjectRoleOption[]>('project-roles', () => []);
  const { contentLanguage } = useContentLanguage();
  const { t } = useI18n();

  function find(key: string | null | undefined): ProjectRoleOption | null {
    return roles.value.find((role) => role.key === key) ?? null;
  }

  /** The role's name; a key no longer known (a role deleted meanwhile) is shown as itself. */
  function nameOf(key: string | null | undefined): string {
    const role = find(key);

    return role ? resolveLocalizedText(role.name, contentLanguage.value.primary).value : (key ?? t('project.roles.none'));
  }

  return { roles, find, nameOf };
}

/** Loads (or, after admins change them, reloads) the project roles. */
export async function loadProjectRoles(): Promise<void> {
  const roles = useState<ProjectRoleOption[]>('project-roles', () => []);

  roles.value = await fetchProjectRoles().catch(() => roles.value);
}
