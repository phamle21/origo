<template>
  <fieldset class="flex flex-col gap-4">
    <legend class="sr-only">{{ label }}</legend>
    <div
      v-for="group in groups"
      :key="group.id"
      class="flex flex-col gap-2"
    >
      <p class="text-xs font-semibold tracking-wide text-content-muted uppercase">{{ t(`settings.permissionGroups.${group.id}`) }}</p>
      <label
        v-for="permission in group.permissions"
        :key="permission.key"
        :class="[
          'flex cursor-pointer items-start gap-3 rounded-control border-2 px-4 py-3 transition-colors hover:border-accent',
          modelValue.includes(permission.key) ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
        ]"
      >
        <AppCheckbox
          :model-value="modelValue.includes(permission.key)"
          @update:model-value="toggle(permission.key, $event)"
        />
        <span class="flex min-w-0 flex-col gap-0.5">
          <span class="text-sm font-semibold">{{ textOf(permission.name) }}</span>
          <span
            v-if="textOf(permission.description)"
            class="text-sm text-content-muted"
            >{{ textOf(permission.description) }}</span
          >
          <code class="text-xs text-content-muted">{{ permission.key }}</code>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { PERMISSION_GROUPS, type PermissionEntry, type PermissionScope } from '~~/shared/contracts/access';
import type { LocalizedText } from '~~/shared/contracts/content';

// The permissions of one scope as tickable cards, grouped and ordered as admins arranged them in the
// catalog. In a project, every change needs reading, so ticking any permission ticks "read" too and
// unticking "read" clears the rest.
const READ = 'project.read';

const props = defineProps<{ modelValue: string[]; catalog: PermissionEntry[]; scope: PermissionScope; label: string }>();

const emit = defineEmits<{ 'update:modelValue': [permissions: string[]] }>();

const { t } = useI18n();
const { contentLanguage } = useContentLanguage();

const groups = computed(() =>
  (PERMISSION_GROUPS[props.scope] as readonly string[])
    .map((id) => ({ id, permissions: props.catalog.filter((permission) => permission.group === id).sort((a, b) => a.position - b.position) }))
    .filter((group) => group.permissions.length),
);

function textOf(text: LocalizedText): string {
  return resolveLocalizedText(text, contentLanguage.value.primary).value;
}

function toggle(key: string, isChecked: boolean): void {
  let next = new Set(props.modelValue);

  if (isChecked) {
    next.add(key);
    if (props.scope === 'project') {
      next.add(READ);
    }
  } else if (props.scope === 'project' && key === READ) {
    next = new Set();
  } else {
    next.delete(key);
  }

  emit(
    'update:modelValue',
    props.catalog.map((permission) => permission.key).filter((value) => next.has(value)),
  );
}
</script>
