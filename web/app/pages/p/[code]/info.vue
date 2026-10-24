<template>
  <AppTopbar
    :crumbs="[
      { label: t('project.list.title'), to: localePath('/projects') },
      { label: projectName, to: localePath(`/p/${code}`) },
      { label: t('project.info.title') },
    ]"
  />
  <ProjectNav
    :project-code="code"
    current="info"
  />

  <div class="flex flex-col gap-4 px-4 py-8 sm:px-6">
    <AppErrorNotice
      v-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <template v-else-if="project">
      <AppFormCard
        v-if="project.permissions.canEditProject"
        form-id="project-info-form"
        tile="projects"
        :title="t('project.info.title')"
        :description="t('project.info.description')"
        :error="saving.hasFailed.value ? saving.errorMessage.value : ''"
        @submit="handleSave"
      >
        <AppFormSection
          :number="1"
          :title="t('admin.projects.sections.code')"
          :description="t('project.info.codeFixed')"
        >
          <p class="flex min-h-10 items-center">
            <code class="rounded-control bg-neutral-soft px-3 py-1.5 font-mono text-sm font-semibold">{{ project.code }}</code>
          </p>
        </AppFormSection>

        <AppFormSection
          :number="2"
          :title="t('admin.projects.sections.about')"
          :description="t('admin.projects.sections.aboutHint')"
        >
          <AppLocalizedField
            v-model="draft.name"
            :label="t('admin.projects.name')"
            :max-length="160"
            is-required
            :error-for="(locale) => form.error(`name.${locale}`)"
            @blur="(locale) => form.touch(`name.${locale}`)"
          />
          <AppLocalizedField
            v-model="draft.description"
            :label="t('admin.projects.about')"
            :max-length="5000"
            is-multiline
            :rows="4"
            :error-for="(locale) => form.error(`description.${locale}`)"
            @blur="(locale) => form.touch(`description.${locale}`)"
          />
        </AppFormSection>

        <template #actions>
          <p
            v-if="isSaved && !isDirty"
            role="status"
            class="mr-auto text-sm font-semibold text-success"
          >
            ✓ {{ t('project.info.saved') }}
          </p>
          <AppButton
            variant="secondary"
            :is-disabled="!isDirty || saving.isPending.value"
            @click="restore"
            >{{ t('common.unsaved.discard') }}</AppButton
          >
          <AppButton
            type="submit"
            :is-disabled="!isDirty || saving.isPending.value"
            >{{ saving.isPending.value ? t('common.actions.saving') : t('common.actions.save') }}</AppButton
          >
        </template>
      </AppFormCard>

      <!-- People who may not edit see the same information, read only. -->
      <section
        v-else
        class="flex max-w-5xl flex-col gap-5 rounded-card border border-line bg-surface p-6 shadow-card"
      >
        <h1 class="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <AppTileIcon name="projects" />
          {{ t('project.info.title') }}
        </h1>
        <dl class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-[12rem_minmax(0,1fr)]">
          <dt class="font-semibold text-content-muted">{{ t('admin.projects.code') }}</dt>
          <dd>
            <code class="font-mono font-semibold">{{ project.code }}</code>
          </dd>
          <dt class="font-semibold text-content-muted">{{ t('admin.projects.name') }}</dt>
          <dd>
            <AppLocalizedText :text="project.name" />
          </dd>
          <dt class="font-semibold text-content-muted">{{ t('admin.projects.about') }}</dt>
          <dd class="whitespace-pre-line">
            <AppLocalizedText :text="project.description" />
          </dd>
        </dl>
        <p class="flex items-center gap-2 text-xs text-content-muted">
          <AppIcon
            name="lock"
            :size="14"
          />
          {{ t('project.info.readOnly') }}
        </p>
      </section>

      <section
        v-if="project.permissions.canArchive || project.permissions.canDelete"
        class="flex max-w-5xl flex-col gap-4 rounded-card border-2 border-danger/40 bg-surface p-6 shadow-card"
      >
        <h2 class="flex items-center gap-2 text-lg font-bold text-danger">
          <AppIcon name="shield" />
          {{ t('project.danger.title') }}
        </h2>
        <div
          v-if="project.permissions.canArchive"
          class="flex flex-wrap items-center justify-between gap-3 rounded-control bg-danger-soft/40 px-4 py-3"
        >
          <span class="flex min-w-0 flex-col gap-0.5">
            <span class="font-semibold">{{ t(project.archivedAt ? 'project.danger.unarchiveTitle' : 'project.danger.archiveTitle') }}</span>
            <span class="text-sm text-content-muted">{{ t(project.archivedAt ? 'project.danger.unarchiveHint' : 'project.danger.archiveHint') }}</span>
          </span>
          <AppButton
            :variant="project.archivedAt ? 'secondary' : 'danger'"
            @click="project.archivedAt ? handleUnarchive() : (dialog = 'archive')"
          >
            <span class="inline-flex items-center gap-1.5"
              ><AppIcon
                :name="project.archivedAt ? 'unlock' : 'lock'"
                :size="16"
              />{{ t(project.archivedAt ? 'project.danger.unarchive' : 'project.danger.archive') }}</span
            >
          </AppButton>
        </div>
        <div
          v-if="project.permissions.canDelete"
          class="flex flex-wrap items-center justify-between gap-3 rounded-control bg-danger-soft/40 px-4 py-3"
        >
          <span class="flex min-w-0 flex-col gap-0.5">
            <span class="font-semibold">{{ t('project.danger.deleteTitle') }}</span>
            <span class="text-sm text-content-muted">{{ t('project.danger.deleteHint') }}</span>
          </span>
          <AppButton
            variant="danger"
            @click="dialog = 'delete'"
          >
            <span class="inline-flex items-center gap-1.5"
              ><AppIcon
                name="trash"
                :size="16"
              />{{ t('project.danger.delete') }}</span
            >
          </AppButton>
        </div>
      </section>

      <AppTypeToConfirmDialog
        :open="dialog === 'archive'"
        :title="t('project.danger.archiveConfirm', { code: project.code })"
        :consequences="[t('project.danger.archiveEffects.readOnly'), t('project.danger.archiveEffects.list'), t('project.danger.archiveEffects.back')]"
        :phrase="project.code"
        :confirm-label="t('project.danger.archive')"
        :is-pending="archiving.isPending.value"
        :error="archiving.errorMessage.value"
        @confirm="handleArchive"
        @cancel="dialog = null"
      />
      <AppTypeToConfirmDialog
        :open="dialog === 'delete'"
        :title="t('project.danger.deleteConfirm', { code: project.code })"
        :description="t('project.danger.deleteWarning')"
        :consequences="[
          t('project.danger.deleteEffects.screens', { screens: data?.screens.length ?? 0, points: project.pointCount }),
          t('project.danger.deleteEffects.plan'),
          t('project.danger.deleteEffects.members'),
          t('project.danger.deleteEffects.never'),
        ]"
        :phrase="project.code"
        :confirm-label="t('project.danger.deleteButton')"
        :is-pending="deleting.isPending.value"
        :error="deleting.errorMessage.value"
        @confirm="handleDelete"
        @cancel="dialog = null"
      />

      <AppUnsavedBar
        v-if="project.permissions.canEditProject"
        class="max-w-5xl"
        :show="isDirty"
        :is-saving="saving.isPending.value"
        form="project-info-form"
        :hint="t('project.info.unsavedHint')"
        @discard="restore"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import ProjectNav from '@/components/project/ProjectNav.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppFormCard from '@/components/ui/AppFormCard.vue';
import AppFormSection from '@/components/ui/AppFormSection.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';
import { archiveProject, deleteProjectForever, unarchiveProject, updateProjectDetails } from '@/api/project/project';
import AppTypeToConfirmDialog from '@/components/ui/AppTypeToConfirmDialog.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { formRules } from '@/utils/form-rules';
import type { LocalizedText } from '~~/shared/contracts/content';

const schema = z.object({
  name: formRules.localized(160, true),
  description: formRules.localized(5_000, false),
});

const { t } = useI18n();
const localePath = useLocalePath();
const { code } = useProjectRoute();
const { contentLanguage } = useContentLanguage();
// The form starts from the saved values, so it waits for them before the page opens.
const { data, hasFailed, errorMessage, refresh } = await useProjectScreens(code, { isBlocking: true });

const project = computed(() => data.value?.project ?? null);
const projectName = computed(() => (project.value ? resolveLocalizedText(project.value.name, contentLanguage.value.primary).value : code.value));

const draft = ref<{ name: LocalizedText; description: LocalizedText }>({ name: { vi: null }, description: { vi: null } });
const saved = computed(() => JSON.stringify({ name: project.value?.name ?? null, description: project.value?.description ?? null }));
const isDirty = computed(() => Boolean(project.value) && JSON.stringify(draft.value) !== saved.value);
const form = useFormValidation(schema, () => draft.value);
const saving = useAppRequest(updateProjectDetails);
const isSaved = ref(false);

function restore(): void {
  if (project.value) {
    draft.value = { name: { ...project.value.name }, description: { ...project.value.description } };
  }
  form.reset();
}

watch(project, restore, { immediate: true });
useUnsavedChanges(isDirty);

function trimmed(text: LocalizedText): LocalizedText {
  return Object.fromEntries(Object.entries(text).map(([locale, value]) => [locale, value?.trim() || null])) as LocalizedText;
}

async function handleSave(): Promise<void> {
  isSaved.value = false;

  if (!form.validate()) {
    return;
  }
  if (await saving.execute(code.value, { name: trimmed(draft.value.name), description: trimmed(draft.value.description) })) {
    // The project list caches names too; both reload so every page shows the new name.
    await Promise.all([refresh(), refreshNuxtData('project-list')]);
    isSaved.value = true;
  }
}

// Archiving and deleting for good each need the project code typed in; bringing an archive back only asks.
const dialog = ref<'archive' | 'delete' | null>(null);
const archiving = useAppRequest(archiveProject);
const unarchiving = useAppRequest(unarchiveProject);
const deleting = useAppRequest(deleteProjectForever);
const confirm = useConfirm();

async function reloadProject(): Promise<void> {
  await Promise.all([refresh(), refreshNuxtData('project-list')]);
}

async function handleArchive(): Promise<void> {
  if (await archiving.execute(code.value)) {
    dialog.value = null;
    await reloadProject();
  }
}

async function handleUnarchive(): Promise<void> {
  if (
    (await confirm(t('project.danger.unarchiveConfirm', { code: code.value }), { confirmLabel: t('project.danger.unarchive') })) &&
    (await unarchiving.execute(code.value))
  ) {
    await reloadProject();
  }
}

async function handleDelete(typed: string): Promise<void> {
  if (await deleting.execute(code.value, typed)) {
    dialog.value = null;
    clearNuxtData((key) => key.includes(`:${code.value}`) || key === 'project-list');
    await navigateTo(localePath('/projects'));
  }
}

useSeoMeta({ title: () => `${t('project.info.title')} · ${projectName.value}` });
</script>
