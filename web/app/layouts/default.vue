<template>
  <div class="flex min-h-dvh flex-col bg-canvas text-content">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-accent focus:px-3 focus:py-1.5 focus:text-sm focus:text-accent-contrast"
    >
      {{ t('layout.skipToContent') }}
    </a>

    <header class="relative z-30 border-b border-line-strong bg-surface">
      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2 sm:px-5">
        <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <AppLauncher
            :apps="apps"
            :current="section"
          />
          <AppLogo :to="localePath('/')" />
          <span
            aria-hidden="true"
            class="hidden h-6 w-px bg-line-strong sm:block"
          />
          <span class="text-lg font-bold tracking-tight">{{ sectionTitle }}</span>
          <nav
            v-if="sectionNav.length"
            :aria-label="t('layout.mainNav')"
          >
            <ul class="flex flex-wrap gap-1">
              <li
                v-for="item in sectionNav"
                :key="item.to"
              >
                <NuxtLink
                  :to="item.to"
                  :aria-current="item.isActive ? 'page' : undefined"
                  :class="[
                    'inline-flex min-h-9 items-center rounded-control px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    item.isActive ? 'bg-accent text-accent-contrast shadow-sm' : 'text-content-muted hover:bg-neutral-soft hover:text-content',
                  ]"
                  >{{ item.label }}</NuxtLink
                >
              </li>
            </ul>
          </nav>
        </div>
        <div
          v-if="currentUser"
          class="flex items-center gap-1"
        >
          <NotificationBell />
          <UserMenu
            v-model:theme="theme"
            v-model:secondary-language="secondaryLanguage"
            :content-languages="contentLanguages"
            :primary-content-language="contentLanguage.primary"
            :user="currentUser"
            :language-options="languageOptions"
            :current-language="locale"
            @sign-out="handleSignOut"
          />
        </div>
      </div>
    </header>

    <main
      id="main-content"
      class="min-w-0 flex-1"
    >
      <div
        v-if="subNav.length"
        class="flex min-h-full flex-col lg:flex-row"
      >
        <SubNavSidebar :groups="subNav" />
        <div class="min-w-0 flex-1">
          <slot />
        </div>
      </div>
      <slot v-else />
    </main>
    <AppConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import AppLauncher from '@/components/layout/AppLauncher.vue';
import SubNavSidebar, { type SubNavGroup } from '@/components/layout/SubNavSidebar.vue';
import type { AppIconName } from '@/components/ui/AppIcon.vue';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue';
import AppLogo from '@/components/layout/AppLogo.vue';
import UserMenu from '@/components/layout/UserMenu.vue';
import NotificationBell from '@/components/notification/NotificationBell.vue';
import { logout } from '@/api/auth/auth';
import { isPathWithin, resolveAppSection } from '@/utils/app-sections';
import { CONTENT_LANGUAGE_KEY } from '@/utils/content-language';

const LANGUAGE_ORDER = ['vi', 'ja', 'en'] as const;

const { t, locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const { contentLanguage, secondaryLanguage } = useContentLanguage();
const contentLanguages = useContentLanguages();
const { theme } = useThemeMode();
const currentUser = useCurrentUser();
const access = useSystemAccess();

provide(CONTENT_LANGUAGE_KEY, contentLanguage);

const section = computed(() => resolveAppSection(route.path));

const apps = useApps();

const sectionTitle = computed(() => t(`layout.apps.${section.value}`));

interface NavLink {
  label: string;
  path: string;
  icon?: AppIconName;
  isShown: boolean;
  /** Sub-pages: when the header item is open, they are listed in a sidebar on the left. */
  children?: NavLink[];
}

// Header items of the current app. An item with sub-pages links to its first one and stays active on
// all of them; only then does the page get a sidebar with those sub-pages.
const headerLinks = computed<NavLink[]>(() => {
  if (section.value === 'projects') {
    return [
      { label: t('layout.sectionNav.myProjects'), path: '/projects', isShown: true },
      { label: t('layout.sectionNav.allProjects'), path: '/admin/projects', isShown: access.canSeeAllProjects.value },
    ];
  }
  if (section.value === 'settings') {
    const { canManageUsers, canManageSettings } = access;

    return [
      { label: t('layout.sectionNav.users'), path: '/settings/users', isShown: canManageUsers.value },
      {
        label: t('layout.sectionNav.systemAccess'),
        path: '/settings/roles',
        isShown: canManageSettings.value,
        children: [
          { label: t('layout.sectionNav.roles'), icon: 'shield', path: '/settings/roles', isShown: true },
          { label: t('layout.sectionNav.permissions'), icon: 'key', path: '/settings/permissions', isShown: true },
        ],
      },
      {
        label: t('layout.sectionNav.projectAccess'),
        path: '/settings/project-roles',
        isShown: canManageSettings.value,
        children: [
          { label: t('layout.sectionNav.roles'), icon: 'shield', path: '/settings/project-roles', isShown: true },
          { label: t('layout.sectionNav.permissions'), icon: 'key', path: '/settings/project-permissions', isShown: true },
        ],
      },
      { label: t('layout.sectionNav.stages'), path: '/settings/stages', isShown: canManageSettings.value },
      { label: t('layout.sectionNav.languages'), path: '/settings/languages', isShown: canManageSettings.value },
    ];
  }

  return [];
});

function isLinkActive(link: NavLink): boolean {
  return (link.children ?? [link]).some((child) => isPathWithin(route.path, child.path));
}

const sectionNav = computed(() =>
  headerLinks.value.filter((link) => link.isShown).map((link) => ({ label: link.label, to: localePath(link.path), isActive: isLinkActive(link) })),
);

const subNav = computed<SubNavGroup[]>(() => {
  const open = headerLinks.value.find((link) => link.isShown && link.children && isLinkActive(link));

  return open?.children
    ? [
        {
          id: open.path,
          title: open.label,
          items: open.children.map((child) => ({
            label: child.label,
            icon: child.icon ?? 'chevronRight',
            path: child.path,
            to: localePath(child.path),
            isActive: isPathWithin(route.path, child.path),
          })),
        },
      ]
    : [];
});

async function handleSignOut(): Promise<void> {
  await logout().catch(() => undefined);
  currentUser.value = null;
  clearNuxtData();
  await navigateTo(localePath('/login'));
}

const languageOptions = computed(() => LANGUAGE_ORDER.map((code) => ({ code, to: switchLocalePath(code) })));
</script>
