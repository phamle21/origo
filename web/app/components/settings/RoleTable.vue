<template>
  <section class="flex flex-col rounded-card border border-line bg-surface shadow-card">
    <p
      v-if="!roles.length"
      class="px-6 py-10 text-center text-sm text-content-muted"
    >
      {{ t('settings.roles.empty') }}
    </p>
    <div
      v-else
      class="overflow-x-auto"
    >
      <table class="w-full min-w-[48rem] text-sm">
        <thead class="bg-surface-muted text-left text-xs font-semibold text-content-muted">
          <tr>
            <th
              scope="col"
              class="px-6 py-3"
            >
              {{ t('settings.roles.role') }}
            </th>
            <th
              scope="col"
              class="px-3 py-3"
            >
              {{ t('settings.roles.permissions') }}
            </th>
            <th
              scope="col"
              class="px-3 py-3 text-right"
            >
              {{ countLabel }}
            </th>
            <th
              scope="col"
              class="px-6 py-3"
            >
              <span class="sr-only">{{ t('admin.users.columns.actions') }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr
            v-for="role in roles"
            :key="role.id"
            class="hover:bg-surface-muted"
          >
            <td class="px-6 py-3 align-top">
              <span class="flex flex-wrap items-center gap-2 font-semibold">
                {{ textOf(role.name) }}
                <AppBadge
                  v-if="role.isDefault"
                  tone="accent"
                  >{{ t('settings.roles.default') }}</AppBadge
                >
              </span>
              <p
                v-if="textOf(role.description)"
                class="mt-1 text-xs text-content-muted"
              >
                {{ textOf(role.description) }}
              </p>
            </td>
            <td class="px-3 py-3 align-top">
              <span
                v-if="!role.permissions.length"
                class="text-sm text-content-muted"
                >{{ emptyPermissions }}</span
              >
              <span
                v-else
                class="flex flex-wrap gap-1.5"
              >
                <AppBadge
                  v-for="key in role.permissions"
                  :key="key"
                  tone="info"
                  >{{ permissionName(key) }}</AppBadge
                >
              </span>
            </td>
            <td class="px-3 py-3 text-right align-top tabular-nums">{{ role.count }}</td>
            <td class="px-6 py-3 align-top">
              <div class="flex justify-end gap-2">
                <NuxtLink
                  :to="`${editPath}/${role.id}`"
                  class="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <AppIcon
                    name="pencil"
                    :size="16"
                  />
                  {{ t('admin.users.edit') }}
                </NuxtLink>
                <AppButton
                  variant="danger"
                  :is-disabled="role.count > 0 || role.isDefault"
                  :title="role.count > 0 || role.isDefault ? deleteRule : undefined"
                  :aria-label="t('settings.roles.deleteNamed', { name: textOf(role.name) })"
                  @click="emit('delete', role.id)"
                >
                  <AppIcon
                    name="trash"
                    :size="16"
                  />
                </AppButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="rounded-b-card border-t border-line bg-surface-muted px-6 py-3 text-xs text-content-muted">{{ deleteRule }}</p>
  </section>
</template>

<script setup lang="ts">
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import type { PermissionEntry } from '~~/shared/contracts/access';
import type { LocalizedText } from '~~/shared/contracts/content';

export interface RoleRow {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  permissions: string[];
  /** People holding the role: users for a system role, project members for a project role. */
  count: number;
  isDefault?: boolean;
}

// The role list of System roles and Project roles: name, ticked permissions (named from the catalog),
// how many people hold it, and edit/delete. A role in use or the default role cannot be deleted.
const props = defineProps<{
  roles: RoleRow[];
  catalog: PermissionEntry[];
  editPath: string;
  countLabel: string;
  emptyPermissions: string;
  deleteRule: string;
}>();

const emit = defineEmits<{ delete: [roleId: string] }>();

const { t } = useI18n();
const { contentLanguage } = useContentLanguage();

function textOf(text: LocalizedText): string {
  return resolveLocalizedText(text, contentLanguage.value.primary).value;
}

function permissionName(key: string): string {
  const permission = props.catalog.find((entry) => entry.key === key);

  return permission ? textOf(permission.name) : key;
}
</script>
