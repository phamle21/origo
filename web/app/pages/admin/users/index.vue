<template>
  <div />
</template>

<script setup lang="ts">
// People moved into Settings; old links keep working.
await navigateTo(useLocalePath()('/settings/users'), { replace: true, redirectCode: 301 });
</script>
