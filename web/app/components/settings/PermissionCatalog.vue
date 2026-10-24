<template>
  <div class="flex flex-col gap-4">
    <section
      v-for="group in groups"
      :key="group.id"
      class="flex flex-col rounded-card border border-line bg-surface shadow-card"
    >
      <h2 class="border-b border-line px-6 py-3 text-sm font-semibold tracking-wide text-content-muted uppercase">
        {{ t(`settings.permissionGroups.${group.id}`) }}
      </h2>
      <ul class="divide-y divide-line">
        <li
          v-for="permission in group.permissions"
          :key="permission.id"
          class="flex flex-wrap items-start gap-3 px-6 py-3"
        >
          <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="font-semibold">{{ textOf(permission.name) }}</span>
            <span
              v-if="textOf(permission.description)"
              class="text-sm text-content-muted"
              >{{ textOf(permission.description) }}</span
            >
            <code class="text-xs text-content-muted">{{ permission.key }}</code>
          </span>
          <AppBadge tone="neutral">{{ t('settings.permissionCatalog.roleCount', usage(permission.key)) }}</AppBadge>
          <AppButton
            variant="secondary"
            :aria-label="t('settings.permissionCatalog.editNamed', { name: textOf(permission.name) })"
            @click="open(permission)"
          >
            <span class="inline-flex items-center gap-1.5"
              ><AppIcon
                name="pencil"
                :size="16"
              />{{ t('admin.users.edit') }}</span
            >
          </AppButton>
        </li>
      </ul>
    </section>

    <AppDialog
      :open="Boolean(editing)"
      icon="key"
      :title="editing ? textOf(editing.name) : ''"
      :description="editing ? t('settings.permissionCatalog.keyFixed', { key: editing.key }) : ''"
      :is-dirty="isDirty"
      @update:open="(isOpen) => !isOpen && close()"
    >
      <form
        v-if="draft"
        novalidate
        class="flex flex-col gap-4"
        @submit.prevent="handleSave"
      >
        <AppLocalizedField
          v-model="draft.name"
          :label="t('settings.permissionCatalog.name')"
          :max-length="80"
          is-required
          :error-for="(locale) => form.error(`name.${locale}`)"
          @blur="(locale) => form.touch(`name.${locale}`)"
        />
        <AppLocalizedField
          v-model="draft.description"
          :label="t('settings.permissionCatalog.about')"
          :max-length="300"
          is-multiline
          :error-for="(locale) => form.error(`description.${locale}`)"
          @blur="(locale) => form.touch(`description.${locale}`)"
        />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <label class="flex flex-col gap-1.5 text-sm font-semibold">
            {{ t('settings.permissionCatalog.group') }}
            <AppSelect
              v-model="draft.group"
              class="w-full font-normal"
              :options="PERMISSION_GROUPS[scope].map((id) => ({ value: id, label: t(`settings.permissionGroups.${id}`) }))"
            />
          </label>
          <label class="flex flex-col gap-1.5 text-sm font-semibold">
            {{ t('settings.permissionCatalog.position') }}
            <input
              v-model.number="draft.position"
              type="number"
              min="0"
              max="999"
              class="min-h-10 rounded-control border border-line-strong bg-surface px-3 text-sm font-normal"
            />
          </label>
        </div>
        <p
          v-if="saving.hasFailed.value"
          role="alert"
          class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {{ saving.errorMessage.value }}
        </p>
        <div class="flex justify-end gap-2 border-t border-line pt-4">
          <AppButton
            variant="secondary"
            @click="close"
            >{{ t('common.actions.cancel') }}</AppButton
          >
          <AppButton
            type="submit"
            :is-disabled="!isDirty || saving.isPending.value"
            >{{ saving.isPending.value ? t('common.actions.saving') : t('common.actions.save') }}</AppButton
          >
        </div>
      </form>
    </AppDialog>
  </div>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import { z } from 'zod';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import { updatePermission } from '@/api/settings/settings';
import { resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';
import { PERMISSION_GROUPS, type PermissionEntry, type PermissionPayload, type PermissionScope } from '~~/shared/contracts/access';
import type { LocalizedText } from '~~/shared/contracts/content';

// The permission catalog of one scope, grouped. Each permission is checked by code, so its key never
// changes; admins rename it, describe it, move it to another group or change its order.
const props = defineProps<{
  scope: PermissionScope;
  catalog: PermissionEntry[];
  /** Permissions held by each role, to show how many roles use each one. */
  rolePermissions: string[][];
}>();

const emit = defineEmits<{ saved: [] }>();

const schema = z.object({ name: formRules.localized(80, true), description: formRules.localized(300, false) });

const { t } = useI18n();
const { contentLanguage } = useContentLanguage();
const editing = ref<PermissionEntry | null>(null);
const draft = ref<PermissionPayload | null>(null);
const form = useFormValidation(schema, () => draft.value ?? {});
const saving = useAppRequest(updatePermission);

const groups = computed(() =>
  (PERMISSION_GROUPS[props.scope] as readonly string[])
    .map((id) => ({ id, permissions: props.catalog.filter((permission) => permission.group === id).sort((a, b) => a.position - b.position) }))
    .filter((group) => group.permissions.length),
);
const isDirty = computed(
  () =>
    Boolean(editing.value && draft.value) &&
    JSON.stringify(draft.value) !==
      JSON.stringify({ name: editing.value?.name, description: editing.value?.description, group: editing.value?.group, position: editing.value?.position }),
);

function textOf(text: LocalizedText): string {
  return resolveLocalizedText(text, contentLanguage.value.primary).value;
}

function usage(key: string): number {
  return props.rolePermissions.filter((permissions) => permissions.includes(key)).length;
}

function open(permission: PermissionEntry): void {
  editing.value = permission;
  draft.value = { name: { ...permission.name }, description: { ...permission.description }, group: permission.group, position: permission.position };
  form.reset();
}

function close(): void {
  editing.value = null;
  draft.value = null;
}

async function handleSave(): Promise<void> {
  if (!editing.value || !draft.value || !form.validate()) {
    return;
  }
  if (await saving.execute(props.scope, editing.value.id, { ...draft.value, position: Math.max(0, Math.min(999, Math.round(draft.value.position || 0))) })) {
    close();
    emit('saved');
  }
}
</script>
