<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.settings'), to: localePath('/settings') }, { label: t('layout.sectionNav.stages') }]" />

  <div class="flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
    <div class="flex max-w-3xl flex-col gap-2">
      <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
        <AppTileIcon name="plan" />
        {{ t('settings.stages.title') }}
      </h1>
      <p class="text-content-muted">{{ t('settings.stages.description') }}</p>
    </div>

    <AppPageSkeleton
      v-if="isPending && !data"
      variant="form"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <section
      v-else-if="stages"
      class="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-card"
    >
      <PlanStageEditor
        v-model:is-dirty="isDirty"
        form-id="stage-template-form"
        :stages="stages"
        :remove-warning="t('settings.stages.removeNote')"
        :is-saving="saving.isPending.value"
        :error="saving.hasFailed.value ? saving.errorMessage.value : ''"
        @save="handleSave"
      />
      <p
        v-if="isSaved"
        role="status"
        class="flex items-center gap-1 text-sm text-success"
      >
        <AppIcon
          name="check"
          :size="16"
        />{{ t('settings.stages.saved') }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import PlanStageEditor from '@/components/plan/PlanStageEditor.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import { fetchStageTemplate, saveStageTemplate } from '@/api/settings/settings';
import type { PlanStagePayload } from '~~/shared/contracts/plan';

const { t } = useI18n();
const localePath = useLocalePath();

if (!useSystemAccess().canManageSettings.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const { data, isPending, hasFailed, errorMessage, refresh } = await useRouteResource('stage-template', () => fetchStageTemplate());
// The template has no stage ids; the editor keys rows by id, so the stable key stands in for it.
const stages = computed(() => data.value?.map((stage) => ({ id: stage.key, startDate: null, endDate: null, owner: null, ...stage })) ?? null);
const saving = useAppRequest(saveStageTemplate);
const isSaved = ref(false);
const isDirty = ref(false);

useUnsavedChanges(isDirty);

async function handleSave(payload: PlanStagePayload[]): Promise<void> {
  isSaved.value = false;

  if (await saving.execute(payload)) {
    isSaved.value = true;
    await refresh();
  }
}

useSeoMeta({ title: () => t('settings.stages.title') });
</script>
