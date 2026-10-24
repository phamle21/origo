<template>
  <section
    v-if="status && !status.isInstalled && status.isTokenRequired && !status.isTokenConfigured"
    class="flex flex-col gap-3 rounded-card border border-line bg-surface p-6 shadow-card"
  >
    <h1 class="text-2xl font-bold tracking-tight">{{ t('install.title') }}</h1>
    <p class="text-sm">{{ t('install.locked') }}</p>
    <code class="rounded-control bg-neutral-soft px-3 py-2 font-mono text-xs break-all">php artisan origo:install</code>
  </section>

  <form
    v-else-if="status && !status.isInstalled"
    class="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-card"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold tracking-tight">{{ t('install.title') }}</h1>
      <p class="text-sm text-content-muted">{{ t('install.description') }}</p>
    </div>

    <AppTextField
      v-if="status.isTokenRequired"
      v-model="draft.token"
      type="password"
      :label="t('install.token')"
      :hint="t('install.tokenHint')"
      :max-length="255"
      is-required
      autocomplete="off"
      :error="form.error('token')"
      @blur="form.touch('token')"
    />
    <AppTextField
      v-model="draft.name"
      :label="t('install.name')"
      :max-length="120"
      is-required
      autocomplete="name"
      :error="form.error('name')"
      @blur="form.touch('name')"
    />
    <AppTextField
      v-model="draft.email"
      type="email"
      :label="t('install.email')"
      :max-length="255"
      is-required
      autocomplete="username"
      :error="form.error('email')"
      @blur="form.touch('email')"
    />
    <AppTextField
      v-model="draft.password"
      type="password"
      :label="t('install.password')"
      :hint="t('install.passwordHint', { min: MIN_PASSWORD_LENGTH })"
      :max-length="255"
      is-required
      autocomplete="new-password"
      :error="form.error('password')"
      @blur="form.touch('password')"
    />
    <AppTextField
      v-model="draft.passwordConfirmation"
      type="password"
      :label="t('install.passwordConfirmation')"
      :max-length="255"
      is-required
      autocomplete="new-password"
      :error="form.error('passwordConfirmation')"
      @blur="form.touch('passwordConfirmation')"
    />

    <p
      v-if="hasFailed && !fieldErrors"
      role="alert"
      class="text-sm text-danger"
    >
      {{ errorMessage }}
    </p>

    <AppButton
      type="submit"
      class="min-h-11"
      :is-disabled="isPending"
      >{{ isPending ? t('install.submitting') : t('install.submit') }}</AppButton
    >
    <p class="text-xs text-content-muted">{{ t('install.commandHint') }} <code class="font-mono">php artisan origo:install</code></p>
  </form>

  <AppErrorNotice
    v-else-if="hasStatusFailed"
    :message="statusErrorMessage"
    :retry-label="t('common.actions.retry')"
    @retry="refresh()"
  />
</template>

<script setup lang="ts">
import { z } from 'zod';
import { fetchInstallStatus, install } from '@/api/install/install';
import AppButton from '@/components/ui/AppButton.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppTextField from '@/components/ui/AppTextField.vue';
import { formRules } from '@/utils/form-rules';

definePageMeta({ layout: 'auth' });

const MIN_PASSWORD_LENGTH = 10;

const { t } = useI18n();
const localePath = useLocalePath();

const { data: status, error: statusError, refresh } = await useAsyncData('install-status', () => fetchInstallStatus());
const hasStatusFailed = computed(() => Boolean(statusError.value));
const statusErrorMessage = computed(() => t('install.unreachable'));

// Once an administrator exists the screen is closed for good; the login page takes over.
watchEffect(() => {
  if (status.value?.isInstalled) {
    navigateTo(localePath('/login'), { replace: true });
  }
});

const draft = reactive({ name: '', email: '', password: '', passwordConfirmation: '', token: '' });
const { fieldErrors, errorMessage, hasFailed, isPending, execute } = useAppRequest(install);
// The install code is asked only where the server requires one, so its rule reads the status.
const schema = z
  .object({
    token: z.string().max(255, { message: 'tooLong' }),
    name: formRules.requiredText(120),
    email: formRules.email(),
    password: formRules.password(MIN_PASSWORD_LENGTH),
    passwordConfirmation: z.string().min(1, { message: 'required' }),
  })
  .refine((value) => value.password === value.passwordConfirmation, { path: ['passwordConfirmation'], message: 'mismatch' })
  .refine((value) => !status.value?.isTokenRequired || value.token.trim() !== '', { path: ['token'], message: 'required' });
const form = useFormValidation(schema, () => draft, { serverFields: fieldErrors });

async function handleSubmit(): Promise<void> {
  if (!form.validate()) {
    return;
  }

  const result = await execute({ ...draft, name: draft.name.trim(), email: draft.email.trim() });

  if (result) {
    await navigateTo({ path: localePath('/login'), query: { installed: result.email } });
  }
}

useSeoMeta({ title: () => t('install.title') });
</script>
