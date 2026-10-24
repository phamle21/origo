import type { AppTileIconName } from '@/components/ui/AppTileIcon.vue';

/**
 * The illustrated user guide. Each topic is a short lesson of numbered steps; each step has a picture
 * of the real screen with orange numbered marks that the step's text refers to. The words live in
 * i18n under `help.topics.<topic>.steps.<step>` (`title`, `text`, optional `tip`), the pictures in
 * `public/images/help/<topic>-<step>.webp`.
 */
export interface HelpStep {
  id: string;
  /** Root-relative picture of the step, or null when words are enough. */
  image: string | null;
  /** Whether the step has an extra tip under its text. */
  hasTip?: boolean;
}

export interface HelpTopic {
  id: string;
  tile: AppTileIconName;
  /** Lessons only some people need, e.g. administration, carry a badge naming who they are for. */
  audience?: 'editors' | 'admins';
  steps: HelpStep[];
}

function steps(topic: string, list: [id: string, hasTip?: boolean][]): HelpStep[] {
  return list.map(([id, hasTip = false]) => ({ id, image: `/images/help/${topic}-${id}.webp`, hasTip }));
}

export const HELP_TOPICS: HelpTopic[] = [
  { id: 'start', tile: 'help', steps: steps('start', [['login', true], ['home'], ['launcher'], ['bell']]) },
  { id: 'projects', tile: 'projects', steps: steps('projects', [['list', true], ['open'], ['tabs'], ['info', true], ['archive', true]]) },
  { id: 'plan-read', tile: 'plan', steps: steps('plan-read', [['rows'], ['legend'], ['done'], ['toolbar', true], ['filter'], ['details']]) },
  {
    id: 'plan-edit',
    tile: 'plan',
    audience: 'editors',
    steps: steps('plan-edit', [['move', true], ['resize'], ['status'], ['reorder'], ['row-menu'], ['note'], ['stages'], ['table']]),
  },
  { id: 'design', tile: 'design', steps: steps('design', [['list'], ['pins'], ['tabs'], ['comment', true], ['delete', true]]) },
  { id: 'members', tile: 'members', audience: 'editors', steps: steps('members', [['add', true], ['role']]) },
  { id: 'languages', tile: 'settings', steps: steps('languages', [['field'], ['dialog', true]]) },
  { id: 'profile', tile: 'people', steps: steps('profile', [['menu'], ['page']]) },
  { id: 'admin', tile: 'admin', audience: 'admins', steps: steps('admin', [['users'], ['roles'], ['project-roles'], ['permissions', true], ['languages']]) },
];

export function findHelpTopic(id: string): HelpTopic | null {
  return HELP_TOPICS.find((topic) => topic.id === id) ?? null;
}
