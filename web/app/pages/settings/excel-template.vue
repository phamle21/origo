<template>
  <AppTopbar :crumbs="[{ label: t('layout.apps.settings'), to: localePath('/settings') }, { label: t('layout.sectionNav.excelTemplate') }]" />

  <div class="flex flex-col gap-4 px-4 py-8 sm:px-6">
    <AppPageSkeleton
      v-if="isPending && !template"
      variant="form"
    />
    <AppErrorNotice
      v-else-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <section
      v-else
      class="flex max-w-5xl flex-col gap-6 rounded-card border border-line bg-surface p-6 shadow-card"
    >
      <div class="flex flex-col gap-2">
        <h1 class="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <AppTileIcon name="settings" />
          {{ t('settings.excelTemplate.title') }}
        </h1>
        <p class="text-sm text-content-muted">{{ t('settings.excelTemplate.description') }}</p>
      </div>

      <!-- 1. The template in use. -->
      <div class="flex flex-col gap-3">
        <h2 class="text-lg font-bold">{{ t('settings.excelTemplate.current') }}</h2>
        <div
          v-if="template"
          class="flex flex-col gap-3 rounded-control border border-line p-4"
        >
          <p class="flex flex-wrap items-center gap-2 text-sm">
            <AppIcon
              name="report"
              :size="18"
              class="text-accent-strong"
            />
            <strong class="break-all">{{ template.originalName }}</strong>
            <span class="text-content-muted">
              {{ t('settings.excelTemplate.uploaded', { name: template.uploadedBy.name, date: formatDate(template.uploadedAt) }) }}
            </span>
          </p>
          <p class="text-sm">
            {{ t('settings.excelTemplate.sheets', { gantt: template.ganttSheet, weekly: template.weeklySheet ?? '—' }) }}
          </p>
          <ul
            v-if="template.warnings.length"
            class="flex flex-col gap-1 rounded-control bg-warning-soft px-3 py-2 text-sm"
          >
            <li
              v-for="warning in template.warnings"
              :key="warning"
            >
              ⚠ {{ warning }}
            </li>
          </ul>
          <div class="flex flex-wrap gap-2">
            <a
              :href="PLAN_TEMPLATE_FILE_URL"
              download
              class="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <AppIcon
                name="download"
                :size="16"
              />{{ t('settings.excelTemplate.download') }}
            </a>
            <AppButton
              variant="danger"
              :is-disabled="removing.isPending.value"
              @click="handleRemove"
            >
              <span class="inline-flex items-center gap-1.5"
                ><AppIcon
                  name="trash"
                  :size="16"
                />{{ t('settings.excelTemplate.remove') }}</span
              >
            </AppButton>
          </div>
        </div>
        <p
          v-else
          class="rounded-control border border-dashed border-line-strong px-4 py-5 text-sm text-content-muted"
        >
          {{ t('settings.excelTemplate.none') }}
        </p>
      </div>

      <!-- 2. Upload. -->
      <form
        class="flex flex-col gap-3 border-t border-line pt-5"
        @submit.prevent="handleUpload()"
      >
        <h2 class="text-lg font-bold">{{ t(template ? 'settings.excelTemplate.replace' : 'settings.excelTemplate.upload') }}</h2>
        <ul class="flex list-disc flex-col gap-1 pl-5 text-sm text-content-muted">
          <li>{{ t('settings.excelTemplate.rules.keep') }}</li>
          <li>{{ t('settings.excelTemplate.rules.clean') }}</li>
          <li>{{ t('settings.excelTemplate.rules.fill') }}</li>
        </ul>
        <label class="flex flex-col gap-1.5 text-sm font-semibold">
          {{ t('settings.excelTemplate.file') }}
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            class="rounded-control border border-line-strong bg-surface p-2 text-sm font-normal file:mr-3 file:rounded-control file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:font-semibold file:text-accent-strong"
            @change="handlePick"
          />
        </label>
        <p
          v-if="pickError"
          role="alert"
          class="text-sm text-danger"
        >
          {{ pickError }}
        </p>
        <p
          v-if="uploading.hasFailed.value"
          role="alert"
          class="text-sm text-danger"
        >
          {{ uploadError }}
        </p>
        <div>
          <AppButton
            type="submit"
            :is-disabled="!pickedFile || uploading.isPending.value"
            >{{ uploading.isPending.value ? t('settings.excelTemplate.uploading') : t('settings.excelTemplate.uploadButton') }}</AppButton
          >
        </div>
      </form>

      <!-- 3. A file with several Gantt sheets: choose the right one. -->
      <div
        v-if="template && template.candidates.length > 1"
        class="flex flex-col gap-2 border-t border-line pt-5"
      >
        <h2 class="text-lg font-bold">{{ t('settings.excelTemplate.chooseSheet') }}</h2>
        <p class="text-sm text-content-muted">{{ t('settings.excelTemplate.chooseSheetHint') }}</p>
        <div class="flex flex-wrap items-center gap-2">
          <AppSelect
            v-model="chosenSheet"
            class="w-72"
            :aria-label="t('settings.excelTemplate.chooseSheet')"
            :options="template.candidates.map((sheet) => ({ value: sheet, label: sheet }))"
          />
          <AppButton
            variant="secondary"
            :is-disabled="!lastFile || chosenSheet === template.ganttSheet || uploading.isPending.value"
            :title="lastFile ? undefined : t('settings.excelTemplate.chooseSheetNeedsFile')"
            @click="handleUpload(chosenSheet)"
            >{{ t('settings.excelTemplate.useSheet') }}</AppButton
          >
        </div>
        <p
          v-if="!lastFile"
          class="text-xs text-content-muted"
        >
          {{ t('settings.excelTemplate.chooseSheetNeedsFile') }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppPageSkeleton from '@/components/ui/AppPageSkeleton.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import { PLAN_TEMPLATE_FILE_URL, deletePlanTemplate, fetchPlanTemplate, uploadPlanTemplate } from '@/api/settings/settings';

/**
 * Settings → Excel template: the team's own project-management workbook that "Export Excel" fills in.
 * The uploaded file is emptied of its project data on the server; only layout, formulas and formats stay.
 */
const MAX_FILE_BYTES = 20 * 1_024 * 1_024;

const { t, locale } = useI18n();
const localePath = useLocalePath();
const confirm = useConfirm();

if (!useSystemAccess().canManageSettings.value) {
  await navigateTo(localePath('/'), { replace: true });
}

const { data, isPending, hasFailed, errorMessage, refresh } = await useRouteResource('plan-template', () => fetchPlanTemplate());
const template = computed(() => data.value ?? null);
const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const pickedFile = ref<File | null>(null);
// Kept after an upload, so another Gantt sheet of the same file can be chosen without picking it again.
const lastFile = ref<File | null>(null);
const pickError = ref('');
const chosenSheet = ref<string | null>(null);
const uploading = useAppRequest(uploadPlanTemplate);
const removing = useAppRequest(deletePlanTemplate);
const uploadError = computed(() => (uploading.error.value?.fields?.file ? t('settings.excelTemplate.invalidFile') : uploading.errorMessage.value));

watch(template, (value) => (chosenSheet.value = value?.ganttSheet ?? null), { immediate: true });

function handlePick(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null;

  pickError.value = '';
  pickedFile.value = null;

  if (!file) {
    return;
  }
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    pickError.value = t('settings.excelTemplate.notXlsx');
  } else if (file.size > MAX_FILE_BYTES) {
    pickError.value = t('settings.excelTemplate.tooLarge', { size: MAX_FILE_BYTES / 1_024 / 1_024 });
  } else {
    pickedFile.value = file;
  }
}

async function handleUpload(sheet: string | null = null): Promise<void> {
  const file = sheet ? lastFile.value : pickedFile.value;

  if (!file) {
    return;
  }

  await uploading.execute(file, sheet);

  if (uploading.hasFailed.value) {
    return;
  }
  lastFile.value = file;
  pickedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  await refresh();
}

async function handleRemove(): Promise<void> {
  const isConfirmed = await confirm(t('settings.excelTemplate.removeConfirm'), {
    description: t('settings.excelTemplate.removeImpact'),
    confirmLabel: t('settings.excelTemplate.remove'),
    tone: 'danger',
  });

  if (isConfirmed && (await removing.execute()) && !removing.hasFailed.value) {
    lastFile.value = null;
    await refresh();
  }
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

useSeoMeta({ title: () => t('settings.excelTemplate.title') });
</script>
