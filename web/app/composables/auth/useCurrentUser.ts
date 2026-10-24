import type { CurrentUser } from '~~/shared/contracts/auth';

/** The signed-in user, resolved once per visit by the auth middleware and shared through hydration. */
export function useCurrentUser() {
  return useState<CurrentUser | null>('current-user', () => null);
}
