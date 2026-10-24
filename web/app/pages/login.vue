<template>
  <form
    class="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-card shadow-sm"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold tracking-tight">{{ t('auth.title') }}</h1>
      <p class="text-sm text-content-muted">{{ t('auth.description') }}</p>
    </div>

    <AppTextField
      v-model="credentials.email"
      type="email"
      :label="t('auth.email')"
      :max-length="255"
      is-required
      autocomplete="username"
      :error="form.error('email')"
      @blur="form.touch('email')"
    />
    <AppTextField
      v-model="credentials.password"
      type="password"
      :label="t('auth.password')"
      :max-length="255"
      is-required
      autocomplete="current-password"
      :error="form.error('password')"
      @blur="form.touch('password')"
    />

    <p
      v-if="hasFailed"
      role="alert"
      class="text-sm text-danger"
    >
      {{ error?.code === 'VALIDATION_FAILED' ? t('auth.failed') : errorMessage }}
    </p>

    <AppButton
      type="submit"
      class="min-h-11"
      :is-disabled="isPending"
      >{{ isPending ? t('auth.submitting') : t('auth.submit') }}</AppButton
    >
  </form>
</template>

<script setup lang="ts">
import { z } from 'zod';
import { login } from '@/api/auth/auth';
import AppButton from '@/components/ui/AppButton.vue';
import AppTextField from '@/components/ui/AppTextField.vue';
import { formRules } from '@/utils/form-rules';

definePageMeta({ layout: 'auth' });

const { t } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const currentUser = useCurrentUser();

const credentials = reactive({ email: '', password: '' });
const { error, errorMessage, hasFailed, isPending, execute } = useAppRequest(login);
// The API answers a wrong email or password with one message on purpose, so only shape is checked here.
const form = useFormValidation(z.object({ email: formRules.email(), password: z.string().min(1, { message: 'required' }) }), () => credentials);

// Only same-site paths are followed after signing in, so the login link cannot redirect elsewhere.
function safeRedirect(): string {
  const target = String(route.query.redirect ?? '');

  return target.startsWith('/') && !target.startsWith('//') ? target : localePath('/');
}

async function handleSubmit(): Promise<void> {
  if (!form.validate()) {
    return;
  }

  const user = await execute({ email: credentials.email.trim(), password: credentials.password });

  if (user) {
    currentUser.value = user;
    await navigateTo(safeRedirect());
  }
}

useSeoMeta({ title: () => t('auth.title') });
</script>
