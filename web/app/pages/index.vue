<template>
  <div class="flex w-full flex-col items-center gap-8 px-4 py-12 sm:px-6 sm:py-16">
    <div class="flex max-w-2xl flex-col items-center gap-2 text-center">
      <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{{ t('home.greeting', { name: currentUser?.name ?? '' }) }}</h1>
      <p class="text-content-muted">{{ t('home.description') }}</p>
    </div>

    <nav
      :aria-label="t('layout.launcher.label')"
      class="w-full max-w-4xl rounded-card bg-tile p-4 sm:p-6"
    >
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="app in apps"
          :key="app.id"
        >
          <NuxtLink
            :to="app.to"
            class="group flex h-full flex-col items-center gap-3 rounded-card border border-line bg-surface px-5 py-6 text-center shadow-card transition-shadow hover:border-accent hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <AppTileIcon
              :name="app.tile"
              size="xl"
            />
            <span class="text-lg font-semibold group-hover:text-accent-strong">{{ app.label }}</span>
            <span class="text-sm text-content-muted">{{ app.description }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import AppTileIcon from '@/components/ui/AppTileIcon.vue';

// Origo's home: one tile per app the person may open (projects, settings, and later modules).
const { t } = useI18n();
const currentUser = useCurrentUser();
const apps = useApps();

useSeoMeta({ title: () => t('layout.apps.home') });
</script>
