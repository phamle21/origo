<template>
  <!-- A thin bar at the top while a page that waits for its data is loading. -->
  <NuxtLoadingIndicator
    color="var(--app-color-accent)"
    :height="3"
  />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
