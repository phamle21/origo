<template>
  <section class="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 p-4">
    <p class="text-sm text-content-muted">{{ statusCode }}</p>
    <h1 class="text-xl font-semibold break-words">{{ t(copy.title) }}</h1>
    <p class="break-words">{{ t(copy.description) }}</p>

    <!-- Only this application's own request id is shown. The error message, stack, and provider detail
         stay on the server, where they were already logged against the same id. -->
    <p
      v-if="requestId"
      class="text-sm [overflow-wrap:anywhere] text-content-muted"
    >
      {{ t('error.requestId', { requestId }) }}
    </p>

    <AppButton @click="handleReturnHome">{{ t('error.backHome') }}</AppButton>
  </section>
</template>

<script setup lang="ts">
import type { NuxtError } from 'nuxt/app';
import AppButton from '@/components/ui/AppButton.vue';
import { toApiErrorData } from '@/api/client';

// An explicit map keeps every translation key greppable; the key is never built from a status code.
const ERROR_COPY = {
  notFound: { title: 'error.notFound.title', description: 'error.notFound.description' },
  unexpected: { title: 'error.unexpected.title', description: 'error.unexpected.description' },
} as const;

const props = defineProps<{ error?: NuxtError }>();

const { t } = useI18n();

const statusCode = computed(() => props.error?.statusCode ?? 500);
const copy = computed(() => (statusCode.value === 404 ? ERROR_COPY.notFound : ERROR_COPY.unexpected));
const requestId = computed(() => toApiErrorData(props.error)?.requestId ?? '');

async function handleReturnHome(): Promise<void> {
  await clearError({ redirect: '/' });
}

useSeoMeta({ title: () => t(copy.value.title) });
</script>
