<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      ref="trigger"
      type="button"
      class="flex items-center gap-2 rounded-control py-1 pr-2 pl-1 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      :aria-label="t('layout.userMenu.open', { name: user.name })"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      @click="toggle"
    >
      <AppAvatar :initials="user.initials" />
      <span class="hidden min-w-0 flex-col text-left leading-tight sm:flex">
        <span class="text-sm font-semibold break-words">{{ user.name }}</span>
        <span class="text-xs text-content-muted">{{ subtitle }}</span>
      </span>
      <AppIcon
        name="chevronDown"
        :size="16"
        class="text-content-muted"
      />
    </button>

    <div
      v-show="isOpen"
      :id="panelId"
      class="absolute top-full right-0 z-40 mt-2 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-card border border-line bg-surface shadow-lg"
    >
      <div class="flex items-center gap-3 border-b border-line px-4 py-3">
        <AppAvatar :initials="user.initials" />
        <div class="flex min-w-0 flex-col leading-tight">
          <span class="font-semibold break-words">{{ user.name }}</span>
          <span class="text-xs break-all text-content-muted">{{ user.email }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-3 border-b border-line px-4 py-3">
        <div
          role="group"
          :aria-label="t('layout.userMenu.theme')"
          class="grid grid-cols-3 gap-1 rounded-control bg-surface-muted p-1"
        >
          <button
            v-for="option in THEME_OPTIONS"
            :key="option.mode"
            type="button"
            :aria-pressed="theme === option.mode"
            :title="t(`layout.theme.${option.mode}`)"
            :class="[
              'flex min-h-8 items-center justify-center gap-1.5 rounded-[0.5rem] text-xs font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-accent',
              theme === option.mode ? 'bg-accent text-accent-contrast shadow-sm' : 'text-content-muted hover:bg-surface hover:text-content',
            ]"
            @click="emit('update:theme', option.mode)"
          >
            <AppIcon
              :name="option.icon"
              :size="16"
            />
            {{ t(`layout.theme.${option.mode}`) }}
          </button>
        </div>

        <div class="flex flex-col gap-1.5">
          <span class="flex items-center gap-1.5 text-xs font-semibold text-content-muted">
            <AppIcon
              name="globe"
              :size="14"
            />
            {{ t('layout.language') }}
          </span>
          <LanguageSwitcher
            :options="languageOptions"
            :current="currentLanguage"
          />
        </div>

        <ContentSecondarySelect
          :model-value="secondaryLanguage"
          :languages="contentLanguages"
          :primary="primaryContentLanguage"
          @update:model-value="emit('update:secondaryLanguage', $event)"
        />
      </div>

      <div class="flex flex-col p-2">
        <NuxtLink
          :to="localePath('/profile')"
          class="flex min-h-10 items-center gap-2.5 rounded-control px-3 text-sm font-semibold hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent"
        >
          <AppIcon name="user" />
          {{ t('layout.userMenu.profile') }}
        </NuxtLink>
        <button
          type="button"
          class="flex min-h-10 items-center gap-2.5 rounded-control px-3 text-left text-sm font-semibold text-danger hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-accent"
          @click="emit('signOut')"
        >
          <AppIcon name="logout" />
          {{ t('auth.signOut') }}
        </button>
        <AppVersion class="border-t border-line px-3 pt-2 pb-1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ContentSecondarySelect from '@/components/content/ContentSecondarySelect.vue';
import AppVersion from '@/components/layout/AppVersion.vue';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import type { CurrentUser } from '~~/shared/contracts/auth';
import type { ContentLanguageOption } from '~~/shared/contracts/content';
import type { ThemeMode } from '@/composables/theme/useThemeMode';

const THEME_OPTIONS = [
  { mode: 'light', icon: 'sun' },
  { mode: 'dark', icon: 'moon' },
  { mode: 'system', icon: 'monitor' },
] as const;

// Everything personal lives behind the avatar, so the top bar keeps only navigation.
const props = defineProps<{
  user: CurrentUser;
  theme: ThemeMode;
  /** Second content language shown under texts; empty for none. */
  secondaryLanguage: string;
  contentLanguages: ContentLanguageOption[];
  primaryContentLanguage: string;
  languageOptions: { code: 'vi' | 'ja' | 'en'; to: string }[];
  currentLanguage: string;
}>();

const emit = defineEmits<{ signOut: []; 'update:theme': [mode: ThemeMode]; 'update:secondaryLanguage': [code: string] }>();

const { t, locale } = useI18n();
const contentLocale = computed(() => (locale.value === 'ja' ? 'ja' : 'vi'));
const localePath = useLocalePath();
const panelId = useId();
const root = useTemplateRef<HTMLElement>('root');
const trigger = useTemplateRef<HTMLElement>('trigger');
const { isOpen, toggle } = useDropdown(root, trigger);

// The job title, then the system role when it is more than a plain member.
const subtitle = computed(() => {
  const role =
    props.user.systemRole && props.user.systemRole.key !== 'member' ? resolveLocalizedText(props.user.systemRole.name, contentLocale.value).value : '';

  return [props.user.title, role].filter(Boolean).join(' · ');
});
</script>
