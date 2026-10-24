<template>
  <AppDialog
    :open="open"
    icon="users"
    :title="t('team.add.title')"
    :description="t('team.add.hint')"
    :is-dirty="Boolean(picked)"
    @update:open="close"
  >
    <form
      novalidate
      class="flex flex-col gap-5"
      @submit.prevent="handleSubmit"
    >
      <section class="flex flex-col gap-2">
        <h3 class="flex items-center gap-2 text-sm font-semibold">
          <span class="flex size-6 items-center justify-center rounded-full bg-accent text-xs text-accent-contrast">1</span>
          {{ t('team.add.whoTitle') }}
        </h3>
        <div
          v-if="picked"
          class="flex min-h-12 items-center gap-3 rounded-control border-2 border-accent bg-accent-soft px-3 py-2"
        >
          <AppAvatar :initials="picked.initials" />
          <span class="flex min-w-0 flex-1 flex-col leading-tight">
            <strong class="break-words">{{ picked.name }}</strong>
            <span class="text-sm break-all text-content-muted">{{ picked.email }}</span>
          </span>
          <button
            type="button"
            class="text-sm font-semibold text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-accent"
            @click="picked = null"
          >
            {{ t('team.add.change') }}
          </button>
        </div>
        <UserPicker
          v-else
          :label="t('team.add.person')"
          :search="search"
          :exclude-ids="excludeIds"
          @pick="picked = $event"
        />
      </section>

      <fieldset class="flex flex-col gap-2">
        <legend class="mb-2 flex items-center gap-2 text-sm font-semibold">
          <span class="flex size-6 items-center justify-center rounded-full bg-accent text-xs text-accent-contrast">2</span>
          {{ t('team.add.roleTitle') }}
        </legend>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            v-for="role in roles"
            :key="role.key"
            :class="[
              'flex cursor-pointer items-start gap-3 rounded-control border-2 px-3 py-2.5 transition-colors hover:border-accent',
              selectedRole === role.key ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
            ]"
          >
            <input
              v-model="selectedRole"
              type="radio"
              name="new-member-role"
              :value="role.key"
              class="mt-1 size-4 accent-[var(--app-color-accent)]"
            />
            <span class="flex min-w-0 flex-col gap-1">
              <span class="text-sm font-semibold">{{ textOf(role.name) }}</span>
              <span
                v-if="textOf(role.description)"
                class="text-xs text-content-muted"
                >{{ textOf(role.description) }}</span
              >
            </span>
          </label>
        </div>
      </fieldset>

      <p
        v-if="error"
        role="alert"
        class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
      >
        {{ error }}
      </p>

      <div class="flex justify-end gap-2 border-t border-line pt-4">
        <AppButton
          variant="secondary"
          @click="close"
          >{{ t('common.actions.cancel') }}</AppButton
        >
        <AppButton
          type="submit"
          :is-disabled="!picked || !selectedRole || isSaving"
          >{{ isSaving ? t('common.actions.saving') : t('team.add.submit') }}</AppButton
        >
      </div>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
import UserPicker from '@/components/team/UserPicker.vue';
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppDialog from '@/components/ui/AppDialog.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import type { ProjectRoleOption } from '~~/shared/contracts/access';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { UserOption } from '~~/shared/contracts/member';

// Adding someone in two steps: pick an existing account, then the role, each role described so the
// choice is clear. New people start on the first role that only reads, the safest choice.
const props = defineProps<{
  open: boolean;
  roles: ProjectRoleOption[];
  search: (query: string) => Promise<UserOption[]>;
  excludeIds: number[];
  isSaving: boolean;
  error: string;
}>();

const emit = defineEmits<{ 'update:open': [isOpen: boolean]; add: [userId: number, role: string] }>();

const { t } = useI18n();
const { contentLanguage } = useContentLanguage();
const picked = ref<UserOption | null>(null);
const selectedRole = ref('');

function safestRole(): string {
  return props.roles.find((role) => role.permissions.length === 1)?.key ?? props.roles.at(-1)?.key ?? '';
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      picked.value = null;
      selectedRole.value = safestRole();
    }
  },
  { immediate: true },
);

function textOf(text: LocalizedText): string {
  return resolveLocalizedText(text, contentLanguage.value.primary).value;
}

function close(): void {
  emit('update:open', false);
}

function handleSubmit(): void {
  if (picked.value && selectedRole.value) {
    emit('add', picked.value.id, selectedRole.value);
  }
}
</script>
