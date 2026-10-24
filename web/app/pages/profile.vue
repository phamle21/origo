<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.profile') }]" />

  <div
    v-if="currentUser"
    class="flex w-full flex-col gap-6 px-4 py-8 sm:px-6"
  >
    <div class="flex flex-wrap items-center gap-4">
      <span class="flex size-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-contrast">{{ currentUser.initials }}</span>
      <div class="flex min-w-0 flex-col gap-1">
        <h1 class="text-3xl font-bold tracking-tight break-words">{{ currentUser.name }}</h1>
        <p class="flex flex-wrap items-center gap-2 text-content-muted">
          <span class="break-all">{{ currentUser.email }}</span>
          <AppBadge v-if="currentUser.title">{{ currentUser.title }}</AppBadge>
          <AppBadge
            v-if="currentUser.systemRole"
            :tone="currentUser.isAdmin ? 'accent' : 'neutral'"
            >{{ resolveLocalizedText(currentUser.systemRole.name, locale === 'ja' ? 'ja' : 'vi').value }}</AppBadge
          >
        </p>
      </div>
    </div>

    <AppUnsavedBar
      class="order-last"
      :show="isProfileDirty"
      :is-saving="profileRequest.isPending.value"
      form="profile-form"
      :hint="t('profile.unsavedHint')"
      @discard="restoreProfile"
    />

    <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div class="flex min-w-0 flex-col gap-6">
        <form
          id="profile-form"
          novalidate
          class="flex flex-col rounded-card border border-line bg-surface shadow-card"
          @submit.prevent="handleSaveProfile"
        >
          <div class="flex items-start gap-3 border-b border-line px-6 py-4">
            <AppIcon
              name="user"
              class="mt-1 text-content-muted"
            />
            <div>
              <h2 class="text-lg font-semibold">{{ t('profile.info.title') }}</h2>
              <p class="text-sm text-content-muted">{{ t('profile.info.description') }}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
            <AppTextField
              v-model="profile.name"
              :label="t('admin.users.name')"
              :max-length="120"
              is-required
              autocomplete="name"
              :error="profileForm.error('name')"
              @blur="profileForm.touch('name')"
            />
            <AppTextField
              :model-value="currentUser.email"
              :label="t('admin.users.email')"
              disabled
            />
            <p class="text-xs text-content-muted md:col-span-2">{{ t('profile.info.managedByAdmin') }}</p>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-3 rounded-b-card border-t border-line bg-surface-muted px-6 py-3">
            <span
              v-if="profileSaved"
              role="status"
              class="flex items-center gap-1 text-sm text-success"
              ><AppIcon
                name="check"
                :size="16"
              />{{ t('profile.saved') }}</span
            >
            <span
              v-if="profileRequest.hasFailed.value"
              role="alert"
              class="text-sm text-danger"
              >{{ profileRequest.errorMessage.value }}</span
            >
            <AppButton
              type="submit"
              :is-disabled="profileRequest.isPending.value || !isProfileDirty"
              >{{ t('common.actions.save') }}</AppButton
            >
          </div>
        </form>

        <form
          novalidate
          class="flex flex-col rounded-card border border-line bg-surface shadow-card"
          @submit.prevent="handleChangePassword"
        >
          <div class="flex items-start gap-3 border-b border-line px-6 py-4">
            <AppIcon
              name="key"
              class="mt-1 text-content-muted"
            />
            <div>
              <h2 class="text-lg font-semibold">{{ t('profile.password.title') }}</h2>
              <p class="text-sm text-content-muted">{{ t('profile.password.description') }}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3">
            <AppTextField
              v-model="passwords.currentPassword"
              type="password"
              :label="t('profile.password.current')"
              is-required
              autocomplete="current-password"
              :error="passwordForm.error('currentPassword')"
              @blur="passwordForm.touch('currentPassword')"
            />
            <AppTextField
              v-model="passwords.password"
              type="password"
              :label="t('profile.password.new')"
              is-required
              autocomplete="new-password"
              :error="passwordForm.error('password')"
              @blur="passwordForm.touch('password')"
            />
            <AppTextField
              v-model="passwords.passwordConfirmation"
              type="password"
              :label="t('profile.password.confirm')"
              is-required
              autocomplete="new-password"
              :error="passwordForm.error('passwordConfirmation')"
              @blur="passwordForm.touch('passwordConfirmation')"
            />
            <p class="text-xs text-content-muted md:col-span-3">{{ t('profile.password.rules') }}</p>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-3 rounded-b-card border-t border-line bg-surface-muted px-6 py-3">
            <span
              v-if="passwordSaved"
              role="status"
              class="flex items-center gap-1 text-sm text-success"
              ><AppIcon
                name="check"
                :size="16"
              />{{ t('profile.password.saved') }}</span
            >
            <span
              v-if="passwordRequest.hasFailed.value && !passwordRequest.fieldErrors.value"
              role="alert"
              class="text-sm text-danger"
              >{{ passwordRequest.errorMessage.value }}</span
            >
            <AppButton
              type="submit"
              :is-disabled="passwordRequest.isPending.value"
              >{{ t('profile.password.submit') }}</AppButton
            >
          </div>
        </form>
      </div>

      <div class="flex flex-col gap-6">
        <section class="flex flex-col rounded-card border border-line bg-surface shadow-card">
          <h2 class="flex items-center gap-2 border-b border-line px-6 py-4 text-lg font-semibold">
            <AppIcon name="monitor" />
            {{ t('profile.preferences') }}
          </h2>
          <div class="flex flex-col gap-4 px-6 py-5">
            <fieldset class="flex flex-col gap-2">
              <legend class="mb-2 text-sm font-semibold">{{ t('layout.userMenu.theme') }}</legend>
              <label
                v-for="mode in THEME_MODES"
                :key="mode"
                class="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  v-model="theme"
                  type="radio"
                  name="theme"
                  :value="mode"
                  class="size-4 accent-accent"
                />
                {{ t(`layout.theme.${mode}`) }}
                <span class="text-content-muted">— {{ t(`profile.themeHint.${mode}`) }}</span>
              </label>
            </fieldset>
            <div class="flex flex-col gap-2">
              <span class="text-sm font-semibold">{{ t('layout.language') }}</span>
              <LanguageSwitcher
                :options="languageOptions"
                :current="locale"
              />
            </div>
            <ContentSecondarySelect
              v-model="secondaryLanguage"
              :languages="contentLanguages"
              :primary="contentLanguage.primary"
            />
          </div>
        </section>

        <section class="flex flex-col rounded-card border border-line bg-surface shadow-card">
          <h2 class="flex items-center gap-2 border-b border-line px-6 py-4 text-lg font-semibold">
            <AppIcon name="folder" />
            {{ t('profile.projects') }}
          </h2>
          <AppPageSkeleton
            v-if="isProjectsPending && !projects"
            variant="rows"
            :rows="3"
          />
          <ul
            v-else-if="myProjects.length"
            class="divide-y divide-line"
          >
            <li
              v-for="project in myProjects"
              :key="project.code"
            >
              <NuxtLink
                :to="localePath(`/p/${project.code}/plan`)"
                class="flex items-center justify-between gap-3 px-6 py-3 hover:bg-surface-muted"
              >
                <span class="flex min-w-0 flex-col leading-tight">
                  <span class="font-mono text-xs font-semibold text-content-muted">{{ project.code }}</span>
                  <AppLocalizedText
                    :text="project.name"
                    class="font-semibold"
                  />
                </span>
                <RoleBadge
                  v-if="project.myRole"
                  :role="project.myRole"
                />
              </NuxtLink>
            </li>
          </ul>
          <p
            v-else
            class="px-6 py-5 text-sm text-content-muted"
          >
            {{ t('profile.noProjects') }}
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import { z } from 'zod';
import ContentSecondarySelect from '@/components/content/ContentSecondarySelect.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue';
import RoleBadge from '@/components/team/RoleBadge.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import AppTextField from '@/components/ui/AppTextField.vue';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';
import { changePassword, updateProfile } from '@/api/auth/auth';
import { THEME_MODES } from '@/composables/theme/useThemeMode';
import { resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';

const MIN_PASSWORD_LENGTH = 10;

const profileSchema = z.object({ name: formRules.requiredText(120) });
// Mirrors the API rule: at least 10 characters, different from the current one, typed twice the same.
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'required' }),
    password: formRules.password(MIN_PASSWORD_LENGTH),
    passwordConfirmation: z.string().min(1, { message: 'required' }),
  })
  .refine((value) => value.password === value.passwordConfirmation, { path: ['passwordConfirmation'], message: 'mismatch' })
  .refine((value) => !value.password || value.password !== value.currentPassword, { path: ['password'], message: 'sameAsCurrent' });
const LANGUAGE_ORDER = ['vi', 'ja', 'en'] as const;

const { t, locale } = useI18n();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const currentUser = useCurrentUser();
const { theme } = useThemeMode();
const { contentLanguage, secondaryLanguage } = useContentLanguage();
const contentLanguages = useContentLanguages();
const { data: projects, isPending: isProjectsPending } = await useProjectList();

const profile = reactive({ name: currentUser.value?.name ?? '' });
const profileSaved = ref(false);
const passwordSaved = ref(false);
const passwords = reactive({ currentPassword: '', password: '', passwordConfirmation: '' });

const profileRequest = useAppRequest(updateProfile);
const passwordRequest = useAppRequest(changePassword);

const languageOptions = computed(() => LANGUAGE_ORDER.map((code) => ({ code, to: switchLocalePath(code) })));
// Admins see every project in the list; the profile shows only the ones the person belongs to.
const myProjects = computed(() => (projects.value ?? []).filter((project) => project.myRole));

const profileForm = useFormValidation(profileSchema, () => profile, { serverFields: profileRequest.fieldErrors });
const passwordForm = useFormValidation(passwordSchema, () => passwords, { serverFields: passwordRequest.fieldErrors });
const isProfileDirty = computed(() => profile.name !== (currentUser.value?.name ?? ''));
// A half-typed password change also counts as unsaved work worth a warning.
const isPasswordDirty = computed(() => Boolean(passwords.currentPassword || passwords.password || passwords.passwordConfirmation));

useUnsavedChanges(computed(() => isProfileDirty.value || isPasswordDirty.value));

function restoreProfile(): void {
  profile.name = currentUser.value?.name ?? '';
  profileForm.reset();
}

async function handleSaveProfile(): Promise<void> {
  profileSaved.value = false;

  if (!profileForm.validate()) {
    return;
  }

  const updated = await profileRequest.execute(profile.name.trim());

  if (updated) {
    currentUser.value = updated;
    profile.name = updated.name;
    profileSaved.value = true;
  }
}

async function handleChangePassword(): Promise<void> {
  passwordSaved.value = false;

  if (!passwordForm.validate()) {
    return;
  }
  if (await passwordRequest.execute({ ...passwords })) {
    Object.assign(passwords, { currentPassword: '', password: '', passwordConfirmation: '' });
    passwordForm.reset();
    passwordSaved.value = true;
  }
}

useSeoMeta({ title: () => t('layout.apps.profile') });
</script>
