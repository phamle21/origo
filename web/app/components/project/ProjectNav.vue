<template>
  <AppSectionNav
    :label="t('project.nav.label')"
    :items="sections"
    :current="current"
  />
  <!-- Every page of an archived project says so, and that nothing can be changed. -->
  <p
    v-if="archivedAt"
    role="status"
    class="flex flex-wrap items-center gap-2 border-b border-warning/40 bg-warning-soft px-4 py-2.5 text-sm text-content sm:px-6"
  >
    <AppIcon
      name="lock"
      :size="16"
      class="text-warning"
    />
    <strong class="text-warning">{{ t('project.archived.title') }}</strong>
    {{ t('project.archived.text', { date: formatDisplayDate(archivedAt.slice(0, 10), locale) }) }}
    <NuxtLink
      v-if="canArchive"
      :to="localePath(`/p/${projectCode}/info`)"
      class="font-semibold text-accent-strong hover:underline"
      >{{ t('project.archived.manage') }}</NuxtLink
    >
  </p>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import AppSectionNav from '@/components/ui/AppSectionNav.vue';
import { formatDisplayDate } from '@/utils/format';

export type ProjectSection = 'plan' | 'design' | 'members' | 'info';

const props = defineProps<{ projectCode: string; current: ProjectSection }>();

const { t, locale } = useI18n();
const localePath = useLocalePath();
// The same request every project page already makes, so this costs nothing extra.
const { data } = await useProjectScreens(() => props.projectCode);

const archivedAt = computed(() => data.value?.project.archivedAt ?? null);
const canArchive = computed(() => Boolean(data.value?.project.permissions.canArchive));

// The plan comes first because work starts there; the design (screen map) stays the project home URL.
const sections = computed(() => [
  { id: 'plan', label: t('project.nav.plan'), icon: 'plan' as const, to: localePath(`/p/${props.projectCode}/plan`) },
  { id: 'design', label: t('project.nav.design'), icon: 'design' as const, to: localePath(`/p/${props.projectCode}`) },
  { id: 'members', label: t('project.nav.members'), icon: 'users' as const, to: localePath(`/p/${props.projectCode}/members`) },
  { id: 'info', label: t('project.nav.info'), icon: 'info' as const, to: localePath(`/p/${props.projectCode}/info`) },
]);
</script>
