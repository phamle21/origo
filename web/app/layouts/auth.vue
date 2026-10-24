<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-4 py-10 text-content">
    <div class="flex w-full max-w-sm flex-col items-center gap-4">
      <AppLogo :to="localePath('/')" />
      <LanguageSwitcher
        :options="languageOptions"
        :current="locale"
      />
    </div>
    <main class="w-full max-w-sm">
      <slot />
    </main>
    <AppVersion />
  </div>
</template>

<script setup lang="ts">
import AppLogo from '@/components/layout/AppLogo.vue';
import AppVersion from '@/components/layout/AppVersion.vue';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';

const LANGUAGE_ORDER = ['vi', 'ja', 'en'] as const;

const { locale } = useI18n();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();

const languageOptions = computed(() => LANGUAGE_ORDER.map((code) => ({ code, to: switchLocalePath(code) })));
</script>
