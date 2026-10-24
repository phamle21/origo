<template>
  <AppBadge :tone="tone">{{ nameOf(role) }}</AppBadge>
</template>

<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue';
import type { ProjectRole } from '~~/shared/contracts/project';

// Roles are created by admins, so the colour follows what the role may do: managing people stands
// out most, changing the plan or design next, reading only stays quiet.
const props = defineProps<{ role: ProjectRole }>();

const { find, nameOf } = useProjectRoles();

const tone = computed(() => {
  const permissions = find(props.role)?.permissions ?? [];

  if (permissions.includes('members.manage')) {
    return 'accent';
  }

  return permissions.includes('plan.edit') || permissions.includes('design.edit') ? 'info' : 'neutral';
});
</script>
