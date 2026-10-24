<template>
  <p class="text-xs text-content-muted tabular-nums">
    <span :title="t('layout.version.title')">{{ t('layout.version.label', { name: config.public.appName, version: config.public.appVersion }) }}</span>
  </p>
</template>

<script setup lang="ts">
// The released version (MAJOR.MINOR.PATCH from package.json), so support and users talk about the same build.
const config = useRuntimeConfig();
const { t } = useI18n();
</script>
