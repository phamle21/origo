<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.home'), to: localePath('/') }, { label: t('help.title') }]" />

  <div class="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
    <div class="flex max-w-3xl flex-col gap-2">
      <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <AppTileIcon name="help" />
        {{ t('help.title') }}
      </h1>
      <p class="text-content-muted">{{ t('help.description') }}</p>
    </div>

    <ol
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      :aria-label="t('help.topicsLabel')"
    >
      <li
        v-for="(topic, index) in HELP_TOPICS"
        :key="topic.id"
      >
        <NuxtLink
          :to="localePath(`/help/${topic.id}`)"
          class="group flex h-full items-start gap-4 rounded-card border border-line bg-surface p-5 shadow-card transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <AppTileIcon
            :name="topic.tile"
            size="lg"
          />
          <span class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="text-xs font-semibold text-accent-strong">{{ t('help.lessonNumber', { number: index + 1 }) }}</span>
            <span class="text-lg font-bold group-hover:text-accent-strong">{{ t(`help.topics.${topic.id}.title`) }}</span>
            <span class="text-sm text-content-muted">{{ t(`help.topics.${topic.id}.summary`) }}</span>
            <span class="mt-2 flex flex-wrap items-center gap-2">
              <AppBadge tone="neutral">{{ t('help.stepCount', { count: topic.steps.length }) }}</AppBadge>
              <AppBadge
                v-if="topic.audience"
                :tone="topic.audience === 'admins' ? 'warning' : 'info'"
                >{{ t(`help.audience.${topic.audience}`) }}</AppBadge
              >
            </span>
          </span>
          <AppIcon
            name="chevronRight"
            class="mt-1 shrink-0 text-content-muted group-hover:text-accent-strong"
          />
        </NuxtLink>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import { HELP_TOPICS } from '@/utils/help-topics';

const { t } = useI18n();
const localePath = useLocalePath();

useSeoMeta({ title: () => t('help.title') });
</script>
