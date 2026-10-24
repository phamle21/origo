<template>
  <AppTopbar
    :crumbs="[
      { label: t('project.list.title'), to: localePath('/projects') },
      { label: projectName, to: localePath(`/p/${code}`) },
      { label: screenName, to: viewPath },
      { label: t('editor.edit') },
    ]"
  >
    <span
      v-if="draft?.isDirty.value"
      class="text-sm font-medium text-warning"
      role="status"
      >{{ t('editor.status.unsaved') }}</span
    >
    <NuxtLink
      :to="viewPath"
      class="inline-flex min-h-9 items-center rounded-control border border-line bg-surface px-3.5 text-sm font-medium hover:border-line-strong"
      >{{ t('editor.actions.cancel') }}</NuxtLink
    >
    <AppButton
      class="min-h-9"
      :is-disabled="!draft || isSaving || !draft.isDirty.value"
      @click="handleSave"
      >{{ isSaving ? t('editor.actions.saving') : t('editor.actions.save') }}</AppButton
    >
  </AppTopbar>

  <div class="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
    <AppErrorNotice
      v-if="hasFailed"
      :message="errorMessage"
      :retry-label="t('common.actions.retry')"
      @retry="refresh()"
    />

    <p
      v-if="saveError"
      role="alert"
      class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ saveError }}
    </p>

    <template v-if="screen && draft">
      <AppCard>
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AppLocalizedField
            v-model="draft.texts.value.name"
            :label="t('editor.fields.name')"
            :max-length="120"
            is-required
          />
          <AppLocalizedField
            v-model="draft.texts.value.flow"
            :label="t('editor.fields.flow')"
            :max-length="120"
          />
          <AppLocalizedField
            v-model="draft.texts.value.purpose"
            :label="t('editor.fields.purpose')"
            :max-length="1_000"
            is-multiline
          />
        </div>
        <div class="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-content-muted">{{ t('editor.source.current') }}:</span>
            <span class="text-sm font-medium [overflow-wrap:anywhere]">{{ sourceLabel }}</span>
            <AppButton
              v-if="screen.source.kind !== 'image'"
              variant="secondary"
              :is-disabled="isSourceBusy"
              @click="handleRecapture"
              >↻ {{ t('editor.source.recapture') }}</AppButton
            >
            <AppButton
              variant="secondary"
              :is-disabled="isSourceBusy"
              :aria-expanded="isChangingSource"
              @click="isChangingSource = !isChangingSource"
              >{{ t('editor.source.change') }}</AppButton
            >
            <AppButton
              variant="secondary"
              class="text-danger"
              :is-disabled="deleteRequest.isPending.value"
              @click="handleDelete"
              >{{ t('editor.actions.deleteScreen') }}</AppButton
            >
          </div>
          <div
            v-if="isChangingSource"
            class="flex flex-col gap-3 rounded-control border border-line p-4"
          >
            <EditorScreenSourceInput v-model="newSource" />
            <AppButton
              class="self-start"
              :is-disabled="!newSource || isSourceBusy"
              @click="handleSourceReplace"
              >{{ t('editor.source.apply') }}</AppButton
            >
          </div>
          <p
            v-if="isSourceBusy"
            role="status"
            class="text-sm text-content-muted"
          >
            {{ t('editor.source.capturing') }}
          </p>
          <p
            v-if="sourceRequest.hasFailed.value || recaptureRequest.hasFailed.value || deleteRequest.hasFailed.value"
            role="alert"
            class="text-sm text-danger"
          >
            {{ sourceRequest.errorMessage.value || recaptureRequest.errorMessage.value || deleteRequest.errorMessage.value }}
          </p>
        </div>
      </AppCard>

      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
        <div class="flex min-w-0 flex-col gap-4">
          <EditorBoxCanvas
            :image="screen.image"
            :image-alt="t('screen.detail.imageAlt', { name: screenName })"
            :boxes="canvasBoxes"
            :selected-key="draft.selectedKey.value"
            @create="draft.addPoint"
            @change="draft.changeBox"
            @select="draft.selectedKey.value = $event"
            @remove="draft.removePoint"
          />
          <EditorPointList
            :points="listItems"
            :selected-key="draft.selectedKey.value"
            @select="draft.selectedKey.value = $event"
            @move="draft.movePoint"
            @remove="draft.removePoint"
          />
        </div>

        <div class="min-w-0 lg:sticky lg:top-20">
          <EditorPointForm
            v-if="draft.selectedPoint.value"
            :key="draft.selectedPoint.value.key"
            :draft="draft.selectedPoint.value"
            :number="draft.selectedIndex.value + 1"
            :concepts="concepts"
            :point-options="context?.points ?? []"
            @update:draft="draft.replacePoint"
            @create-concept="handleCreateConcept"
          />
          <p
            v-else
            class="rounded-card border border-dashed border-line-strong bg-surface p-6 text-sm text-content-muted"
          >
            {{ t('editor.points.selectHint') }}
          </p>
          <p
            v-if="conceptRequest.hasFailed.value"
            role="alert"
            class="mt-2 text-sm text-danger"
          >
            {{ conceptRequest.errorMessage.value }}
          </p>
        </div>
      </div>

      <AppUnsavedBar
        class="mt-4"
        :show="isDirty"
        :is-saving="isSaving"
        :hint="t('editor.status.unsavedHint')"
        @save="handleSave"
        @discard="draft?.revert()"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  createConcept,
  deleteScreen,
  fetchEditorContext,
  recaptureScreen,
  replaceScreenSource,
  saveScreenPoints,
  updateScreenTexts,
} from '@/api/screen/screen';
import EditorBoxCanvas from '@/components/editor/EditorBoxCanvas.vue';
import EditorPointForm from '@/components/editor/EditorPointForm.vue';
import EditorPointList from '@/components/editor/EditorPointList.vue';
import EditorScreenSourceInput from '@/components/editor/EditorScreenSourceInput.vue';
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppErrorNotice from '@/components/ui/AppErrorNotice.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { findUntitledDraftIndex, toPointsPayload } from '@/utils/screen-draft';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { BusinessConcept } from '~~/shared/contracts/screen';
import type { ScreenSourceInput } from '~~/shared/contracts/screen-editor';

const { t } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const { code } = useProjectRoute();
const { contentLanguage } = useContentLanguage();
const screenCode = computed(() => String(route.params.screen ?? '').toUpperCase());
const viewPath = computed(() => localePath(`/p/${code.value}/${screenCode.value}`));

const { data: projectScreens } = await useProjectScreens(code, { isBlocking: true });

if (!projectScreens.value?.project.permissions.canEditDesign) {
  await navigateTo(viewPath.value, { replace: true });
}
const { data: screen, hasFailed, errorMessage, refresh } = await useScreenDetail(code, screenCode, { isBlocking: true });
const { data: context } = await useAsyncData(`editor-context:${code.value}`, () => fetchEditorContext(code.value));

const projectName = computed(() =>
  projectScreens.value ? resolveLocalizedText(projectScreens.value.project.name, contentLanguage.value.primary).value : code.value,
);
const screenName = computed(() => (screen.value ? resolveLocalizedText(screen.value.name, contentLanguage.value.primary).value : screenCode.value));

// The draft is built once; refreshing the screen after a new screenshot must not discard unsaved work.
const draft = screen.value ? useScreenEditorDraft(screen.value) : null;
const createdConcepts = ref<BusinessConcept[]>([]);
const concepts = computed(() => [...(context.value?.concepts ?? []), ...createdConcepts.value]);

const canvasBoxes = computed(() =>
  (draft?.points.value ?? []).map((point, index) => ({
    key: point.key,
    number: index + 1,
    title: resolveLocalizedText(point.title, contentLanguage.value.primary).value,
    box: point.box,
  })),
);
const listItems = computed(() => canvasBoxes.value.map(({ key, title }) => ({ key, title })));

const isSaving = ref(false);
const saveError = ref('');
const textsRequest = useAppRequest(updateScreenTexts);
const pointsRequest = useAppRequest(saveScreenPoints);
const sourceRequest = useAppRequest(replaceScreenSource);
const recaptureRequest = useAppRequest(recaptureScreen);
const isChangingSource = ref(false);
const newSource = ref<ScreenSourceInput | null>(null);
const isSourceBusy = computed(() => sourceRequest.isPending.value || recaptureRequest.isPending.value);

const SOURCE_LABEL_KEYS = { image: 'editor.source.currentImage', html: 'editor.source.currentHtml', url: 'editor.source.currentUrl' } as const;

const sourceLabel = computed(() => {
  const source = screen.value?.source;

  return source ? t(SOURCE_LABEL_KEYS[source.kind], { url: source.url ?? '', width: source.width ?? '' }) : '';
});
const deleteRequest = useAppRequest(deleteScreen);
const conceptRequest = useAppRequest(createConcept);

function clearScreenCaches(): void {
  clearNuxtData([`screen-detail:${code.value}:${screenCode.value}`, `project-screens:${code.value}`, `editor-context:${code.value}`]);
}

async function handleSave(): Promise<void> {
  if (!draft) {
    return;
  }

  const untitledIndex = findUntitledDraftIndex(draft.points.value);

  if (untitledIndex >= 0 || !draft.texts.value.name.vi?.trim()) {
    saveError.value = untitledIndex >= 0 ? t('editor.status.untitled', { number: untitledIndex + 1 }) : t('errors.validationFailed');
    draft.selectedKey.value = draft.points.value[untitledIndex]?.key ?? draft.selectedKey.value;
    return;
  }

  isSaving.value = true;
  saveError.value = '';

  const isTextsSaved = !draft.areTextsDirty.value || (await textsRequest.execute(code.value, screenCode.value, draft.texts.value)) !== null;
  const isPointsSaved = isTextsSaved && (await pointsRequest.execute(code.value, screenCode.value, toPointsPayload(draft.points.value))) !== null;

  isSaving.value = false;

  if (!isPointsSaved) {
    saveError.value = textsRequest.errorMessage.value || pointsRequest.errorMessage.value;
    return;
  }

  draft.markSaved();
  clearScreenCaches();
  await navigateTo({ path: viewPath.value, query: { point: String(draft.selectedIndex.value + 1) } });
}

// A new screenshot keeps the points in place; the draft is untouched, so unsaved edits survive.
async function handleSourceReplace(): Promise<void> {
  if (newSource.value && (await sourceRequest.execute(code.value, screenCode.value, newSource.value))) {
    isChangingSource.value = false;
    newSource.value = null;
    await refresh();
  }
}

async function handleRecapture(): Promise<void> {
  if (await recaptureRequest.execute(code.value, screenCode.value)) {
    await refresh();
  }
}

// Deleting says what goes with the screen: its numbered points (with their comments) and plan links.
async function handleDelete(): Promise<void> {
  const parts = [
    screen.value?.points.length ? t('editor.status.deleteImpact.points', screen.value.points.length) : '',
    screen.value?.features.length ? t('editor.status.deleteImpact.features', screen.value.features.length) : '',
  ].filter(Boolean);
  const isConfirmed = await confirm(t('editor.status.deleteConfirm'), {
    description: parts.length ? t('editor.status.deleteImpact.summary', { parts: parts.join(', ') }) : undefined,
    confirmLabel: t('editor.actions.deleteScreen'),
    tone: 'danger',
  });

  if (!isConfirmed) {
    return;
  }

  if (await deleteRequest.execute(code.value, screenCode.value)) {
    draft?.markSaved();
    clearScreenCaches();
    await navigateTo(localePath(`/p/${code.value}`));
  }
}

async function handleCreateConcept(name: LocalizedText): Promise<void> {
  const concept = await conceptRequest.execute(code.value, { name, description: { vi: null } });
  const selected = draft?.selectedPoint.value;

  if (concept && draft && selected) {
    createdConcepts.value = [...createdConcepts.value, concept];
    draft.replacePoint({ ...selected, concepts: [...selected.concepts, concept.key] });
  }
}

const confirm = useConfirm();
const isDirty = computed(() => Boolean(draft?.isDirty.value));

// Saving moves to the screen page; that navigation must not ask about the changes it just saved.
useUnsavedChanges(isDirty);

useSeoMeta({ title: () => `${t('editor.edit')} · ${screenName.value}` });
</script>
