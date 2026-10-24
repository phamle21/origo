<template>
  <div />
</template>

<script setup lang="ts">
// Settings opens on the first page this person may use.
const { canManageUsers, canManageSettings } = useSystemAccess();
const localePath = useLocalePath();
const target = canManageUsers.value ? '/settings/users' : canManageSettings.value ? '/settings/roles' : '/';

await navigateTo(localePath(target), { replace: true });
</script>
