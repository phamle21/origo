<template>
  <section class="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
    <header class="flex flex-col gap-1">
      <h2 class="text-base font-semibold">{{ t('team.roleGuide') }}</h2>
      <p class="text-xs text-content-muted">{{ t('team.roleGuideHint') }}</p>
    </header>
    <ul class="flex flex-col gap-2">
      <li
        v-for="role in roles"
        :key="role.key"
      >
        <button
          type="button"
          :aria-pressed="activeRole === role.key"
          :class="[
            'flex w-full flex-col gap-2 rounded-control border-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent',
            activeRole === role.key ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent',
          ]"
          @click="emit('filter', activeRole === role.key ? null : role.key)"
        >
          <span class="flex items-center justify-between gap-2">
            <RoleBadge :role="role.key" />
            <span class="text-xs font-semibold text-content-muted tabular-nums">{{ t('team.peopleCount', counts[role.key] ?? 0) }}</span>
          </span>
          <span class="flex flex-wrap gap-x-3 gap-y-1">
            <span
              v-for="permission in permissions"
              :key="permission.key"
              :class="['inline-flex items-center gap-1 text-xs', has(role, permission.key) ? 'text-content' : 'text-content-muted line-through opacity-60']"
            >
              <AppIcon
                :name="has(role, permission.key) ? 'check' : 'lock'"
                :size="12"
                :class="has(role, permission.key) ? 'text-success' : ''"
              />
              {{ textOf(permission.name) }}
            </span>
          </span>
        </button>
      </li>
    </ul>
    <NuxtLink
      v-if="canEditRoles"
      :to="localePath('/settings/project-roles')"
      class="text-xs font-semibold text-accent-strong hover:underline"
      >{{ t('team.editRoles') }} →</NuxtLink
    >
  </section>
</template>

<script setup lang="ts">
import RoleBadge from '@/components/team/RoleBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import type { PermissionEntry, ProjectRoleOption } from '~~/shared/contracts/access';
import type { LocalizedText } from '~~/shared/contracts/content';

// What each project role may do, with how many members hold it here. A click filters the member list
// to that role; a second click shows everyone again.
defineProps<{
  roles: ProjectRoleOption[];
  permissions: PermissionEntry[];
  counts: Record<string, number>;
  activeRole: string | null;
  canEditRoles: boolean;
}>();

const emit = defineEmits<{ filter: [role: string | null] }>();

const { t } = useI18n();
const localePath = useLocalePath();
const { contentLanguage } = useContentLanguage();

function has(role: ProjectRoleOption, key: string): boolean {
  return (role.permissions as string[]).includes(key);
}

function textOf(text: LocalizedText): string {
  return resolveLocalizedText(text, contentLanguage.value.primary).value;
}
</script>
