<template>
  <article class="flex min-w-0 flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
    <header class="flex items-center gap-3">
      <span
        class="grid size-9 shrink-0 place-items-center rounded-full bg-danger-mark text-sm font-bold text-accent-contrast tabular-nums"
        aria-hidden="true"
        >{{ number }}</span
      >
      <AppLocalizedField
        :model-value="draft.title"
        :label="t('editor.fields.title')"
        :max-length="200"
        is-required
        class="flex-1"
        @update:model-value="update({ title: $event })"
      />
    </header>

    <AppTabs
      v-model="activeTab"
      :tabs="tabs"
      :label="t('screen.tabs.label')"
      :id-prefix="idPrefix"
    />

    <div
      :id="`${idPrefix}-panel-${activeTab}`"
      role="tabpanel"
      :aria-labelledby="`${idPrefix}-tab-${activeTab}`"
      class="flex flex-col gap-5"
    >
      <template v-if="activeTab === 'basic'">
        <AppLocalizedField
          :model-value="draft.basic.summary"
          :label="t('editor.fields.summary')"
          is-multiline
          :rows="3"
          @update:model-value="update({ basic: { ...draft.basic, summary: $event } })"
        />
        <fieldset class="flex flex-col gap-3">
          <legend class="mb-1 text-sm font-semibold">{{ t('editor.fields.rules') }}</legend>
          <div
            v-for="(rule, index) in draft.basic.rules"
            :key="index"
            class="flex items-start gap-2"
          >
            <AppLocalizedField
              :model-value="rule"
              :label="`${index + 1}.`"
              is-multiline
              :max-length="1_000"
              class="flex-1"
              @update:model-value="update({ basic: { ...draft.basic, rules: replaceAt(draft.basic.rules, index, $event) } })"
            />
            <AppButton
              variant="secondary"
              class="mt-6"
              @click="update({ basic: { ...draft.basic, rules: removeAt(draft.basic.rules, index) } })"
              >{{ t('editor.actions.removeItem') }}</AppButton
            >
          </div>
          <AppButton
            variant="secondary"
            class="self-start"
            @click="update({ basic: { ...draft.basic, rules: [...draft.basic.rules, emptyLocalizedText()] } })"
            >+ {{ t('editor.actions.addRule') }}</AppButton
          >
        </fieldset>
        <fieldset class="flex flex-col gap-3">
          <legend class="mb-1 text-sm font-semibold">{{ t('editor.fields.history') }}</legend>
          <div
            v-for="(entry, index) in draft.history"
            :key="index"
            class="flex flex-col gap-2 rounded-control border border-line p-3"
          >
            <label class="flex flex-col gap-1 text-sm font-medium">
              {{ t('editor.fields.phase') }}
              <input
                type="text"
                :value="entry.phase"
                maxlength="40"
                class="min-h-10 rounded-control border border-line-strong bg-surface px-3 text-sm font-normal focus:border-accent focus:outline-none"
                @input="update({ history: replaceAt(draft.history, index, { ...entry, phase: ($event.target as HTMLInputElement).value }) })"
              />
            </label>
            <AppLocalizedField
              :model-value="entry.note"
              :label="t('editor.fields.note')"
              :max-length="1_000"
              @update:model-value="update({ history: replaceAt(draft.history, index, { ...entry, note: $event }) })"
            />
            <AppButton
              variant="secondary"
              class="self-end"
              @click="update({ history: removeAt(draft.history, index) })"
              >{{ t('editor.actions.removeItem') }}</AppButton
            >
          </div>
          <AppButton
            variant="secondary"
            class="self-start"
            @click="update({ history: [...draft.history, { phase: '', note: emptyLocalizedText() }] })"
            >+ {{ t('editor.actions.addHistory') }}</AppButton
          >
        </fieldset>
      </template>

      <template v-else-if="activeTab === 'detail'">
        <fieldset class="flex flex-col gap-3">
          <legend class="mb-1 text-sm font-semibold">{{ t('editor.fields.detailRows') }}</legend>
          <div
            v-for="(row, index) in draft.detail.rows"
            :key="index"
            class="flex flex-col gap-2 rounded-control border border-line p-3"
          >
            <AppLocalizedField
              :model-value="row.item"
              :label="t('editor.fields.item')"
              :max-length="200"
              @update:model-value="update({ detail: { ...draft.detail, rows: replaceAt(draft.detail.rows, index, { ...row, item: $event }) } })"
            />
            <AppLocalizedField
              :model-value="row.spec"
              :label="t('editor.fields.spec')"
              is-multiline
              @update:model-value="update({ detail: { ...draft.detail, rows: replaceAt(draft.detail.rows, index, { ...row, spec: $event }) } })"
            />
            <AppButton
              variant="secondary"
              class="self-end"
              @click="update({ detail: { ...draft.detail, rows: removeAt(draft.detail.rows, index) } })"
              >{{ t('editor.actions.removeItem') }}</AppButton
            >
          </div>
          <AppButton
            variant="secondary"
            class="self-start"
            @click="update({ detail: { ...draft.detail, rows: [...draft.detail.rows, { item: emptyLocalizedText(), spec: emptyLocalizedText() }] } })"
            >+ {{ t('editor.actions.addRow') }}</AppButton
          >
        </fieldset>
        <label class="flex flex-col gap-1 text-sm font-semibold">
          {{ t('editor.fields.endpoints') }}
          <textarea
            :value="draft.detail.endpoints.join('\n')"
            rows="3"
            class="w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2 font-mono text-xs font-normal focus:border-accent focus:outline-none"
            @input="update({ detail: { ...draft.detail, endpoints: toLines(($event.target as HTMLTextAreaElement).value) } })"
          />
        </label>
      </template>

      <template v-else-if="activeTab === 'tests'">
        <fieldset
          v-for="(test, index) in draft.tests"
          :key="index"
          class="flex flex-col gap-2 rounded-control border border-line p-3"
        >
          <legend class="px-1 text-sm font-semibold">{{ t('screen.tests.caseLabel', { number: index + 1 }) }}</legend>
          <AppLocalizedField
            v-for="step in TEST_STEPS"
            :key="step"
            :model-value="test[step]"
            :label="t(TEST_STEP_LABEL_KEYS[step])"
            :max-length="1_000"
            @update:model-value="update({ tests: replaceAt(draft.tests, index, { ...test, [step]: $event }) })"
          />
          <AppButton
            variant="secondary"
            class="self-end"
            @click="update({ tests: removeAt(draft.tests, index) })"
            >{{ t('editor.actions.removeItem') }}</AppButton
          >
        </fieldset>
        <AppButton
          variant="secondary"
          class="self-start"
          @click="update({ tests: [...draft.tests, { given: emptyLocalizedText(), when: emptyLocalizedText(), then: emptyLocalizedText() }] })"
          >+ {{ t('editor.actions.addTest') }}</AppButton
        >
      </template>

      <template v-else>
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1 text-sm font-semibold">{{ t('editor.fields.concepts') }}</legend>
          <label
            v-for="concept in concepts"
            :key="concept.key"
            :class="[
              'flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 text-sm',
              draft.concepts.includes(concept.key) ? 'bg-accent-soft' : 'hover:bg-surface-muted',
            ]"
          >
            <AppCheckbox
              :model-value="draft.concepts.includes(concept.key)"
              @update:model-value="toggleConcept(concept.key, $event)"
            />
            <AppLocalizedText :text="concept.name" />
          </label>
          <div class="flex flex-col gap-2 rounded-control border border-dashed border-line-strong p-3">
            <AppLocalizedField
              v-model="newConceptName"
              :label="t('editor.fields.newConcept')"
              :max-length="120"
            />
            <AppButton
              variant="secondary"
              class="self-start"
              :is-disabled="!newConceptName.vi?.trim()"
              @click="handleCreateConcept"
              >+ {{ t('editor.actions.addConcept') }}</AppButton
            >
          </div>
        </fieldset>
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-1 text-sm font-semibold">{{ t('editor.fields.dependsOn') }}</legend>
          <ul
            v-if="chosenDependencies.length"
            class="flex flex-col gap-1"
          >
            <li
              v-for="option in chosenDependencies"
              :key="option.id"
              class="flex items-center justify-between gap-2 rounded-control bg-surface-muted px-3 py-1.5 text-sm"
            >
              <span class="min-w-0 break-words">{{ optionLabel(option) }}</span>
              <button
                type="button"
                class="shrink-0 text-sm text-danger hover:underline"
                @click="update({ dependsOn: draft.dependsOn.filter((id) => id !== option.id) })"
              >
                {{ t('editor.actions.removeItem') }}
              </button>
            </li>
          </ul>
          <div class="flex gap-2">
            <AppSelect
              v-model="pendingDependency"
              class="min-w-0 flex-1"
              :aria-label="t('editor.fields.dependsOn')"
              :placeholder="t('editor.fields.choosePoint')"
              :options="[
                { value: '', label: t('editor.fields.choosePoint') },
                ...availableDependencies.map((option) => ({ value: option.id, label: optionLabel(option) })),
              ]"
            />
            <AppButton
              variant="secondary"
              :is-disabled="!pendingDependency"
              @click="addDependency"
              >{{ t('editor.actions.addDependency') }}</AppButton
            >
          </div>
        </fieldset>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import AppSelect from '@/components/ui/AppSelect.vue';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import AppTabs from '@/components/ui/AppTabs.vue';
import { CONTENT_LANGUAGE_KEY, DEFAULT_CONTENT_VIEW, resolveLocalizedText } from '@/utils/content-language';
import { emptyLocalizedText, type PointDraft } from '@/utils/screen-draft';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { BusinessConcept } from '~~/shared/contracts/screen';
import type { PointOption } from '~~/shared/contracts/screen-editor';

type EditorTab = 'basic' | 'detail' | 'tests' | 'impact';

const TEST_STEPS = ['given', 'when', 'then'] as const;
const TEST_STEP_LABEL_KEYS: Record<(typeof TEST_STEPS)[number], string> = {
  given: 'editor.fields.given',
  when: 'editor.fields.when',
  then: 'editor.fields.then',
};

const props = defineProps<{
  draft: PointDraft;
  number: number;
  concepts: BusinessConcept[];
  /** Saved points of the whole project; the edited point itself is left out of the choices. */
  pointOptions: PointOption[];
}>();

const emit = defineEmits<{
  'update:draft': [draft: PointDraft];
  createConcept: [name: LocalizedText];
}>();

const { t } = useI18n();
const injected = inject(CONTENT_LANGUAGE_KEY, null);
const language = computed(() => injected?.value ?? DEFAULT_CONTENT_VIEW);
const idPrefix = useId();

const activeTab = ref<EditorTab>('basic');
const newConceptName = ref<LocalizedText>(emptyLocalizedText());
const pendingDependency = ref<string>('');

const tabs = computed(() => [
  { id: 'basic', label: t('screen.tabs.basic') },
  { id: 'detail', label: t('screen.tabs.detail') },
  { id: 'tests', label: t('screen.tabs.tests'), count: props.draft.tests.length },
  { id: 'impact', label: t('screen.tabs.impact') },
]);

const chosenDependencies = computed(() => props.pointOptions.filter((option) => props.draft.dependsOn.includes(option.id)));
const availableDependencies = computed(() => props.pointOptions.filter((option) => option.id !== props.draft.id && !props.draft.dependsOn.includes(option.id)));

// Every change replaces the draft, so the parent owns the only copy and can tell when it is dirty.
function update(patch: Partial<PointDraft>): void {
  emit('update:draft', { ...props.draft, ...patch });
}

function replaceAt<TItem>(items: readonly TItem[], index: number, value: TItem): TItem[] {
  return items.map((item, position) => (position === index ? value : item));
}

function removeAt<TItem>(items: readonly TItem[], index: number): TItem[] {
  return items.filter((_item, position) => position !== index);
}

function toLines(value: string): string[] {
  return value.split('\n').map((line) => line.trim());
}

function toggleConcept(key: string, isChecked: boolean): void {
  update({ concepts: isChecked ? [...props.draft.concepts, key] : props.draft.concepts.filter((item) => item !== key) });
}

function handleCreateConcept(): void {
  emit('createConcept', newConceptName.value);
  newConceptName.value = emptyLocalizedText();
}

function addDependency(): void {
  if (pendingDependency.value) {
    update({ dependsOn: [...props.draft.dependsOn, pendingDependency.value] });
    pendingDependency.value = '';
  }
}

function optionLabel(option: PointOption): string {
  const screen = resolveLocalizedText(option.screenName, language.value.primary).value;
  const title = resolveLocalizedText(option.title, language.value.primary).value;

  return t('screen.impact.linkLabel', { screen, number: option.number, title });
}
</script>
