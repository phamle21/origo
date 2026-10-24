<template>
  <div />
</template>

<script setup lang="ts">
// The administration opens on the people list.
await navigateTo(useLocalePath()('/settings/users'), { replace: true });
</script>
