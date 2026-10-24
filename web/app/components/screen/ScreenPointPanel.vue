<template>
  <article class="flex min-w-0 flex-col rounded-card border border-line bg-surface shadow-card">
    <header class="flex items-start gap-3 px-5 pt-5 sm:px-6">
      <span
        class="grid size-9 shrink-0 place-items-center rounded-full bg-danger-mark text-sm font-bold text-accent-contrast tabular-nums"
        aria-hidden="true"
        >{{ point.number }}</span
      >
      <AppLocalizedText
        :text="point.title"
        as="h2"
        class="pt-1 text-lg font-semibold"
      />
    </header>

    <div class="px-5 pt-3 sm:px-6">
      <AppTabs
        :tabs="tabs"
        :model-value="activeTab"
        :label="t('screen.tabs.label')"
        :id-prefix="idPrefix"
        @update:model-value="emit('update:activeTab', $event as PointTab)"
      />
    </div>

    <div
      :id="`${idPrefix}-panel-${activeTab}`"
      role="tabpanel"
      :aria-labelledby="`${idPrefix}-tab-${activeTab}`"
      tabindex="0"
      class="flex flex-col gap-5 px-5 py-5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:px-6"
    >
      <h3 class="text-sm font-semibold text-content-muted">{{ t(TAB_TITLE_KEYS[activeTab]) }}</h3>

      <template v-if="activeTab === 'basic'">
        <AppLocalizedText
          :text="point.basic.summary"
          as="p"
          class="leading-relaxed"
        />
        <section
          v-if="point.basic.rules.length"
          class="flex flex-col gap-2"
        >
          <h3 class="text-xs font-semibold tracking-wider text-content-muted uppercase">{{ t('screen.basic.rules') }}</h3>
          <ul class="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
            <li
              v-for="(rule, index) in point.basic.rules"
              :key="index"
            >
              <AppLocalizedText :text="rule" />
            </li>
          </ul>
        </section>
        <section
          v-if="point.history.length"
          class="flex flex-col gap-2"
        >
          <h3 class="text-xs font-semibold tracking-wider text-content-muted uppercase">{{ t('screen.basic.history') }}</h3>
          <ul class="flex flex-col gap-1.5 text-sm">
            <li
              v-for="(entry, index) in point.history"
              :key="index"
              class="flex flex-wrap items-baseline gap-x-2"
            >
              <AppBadge tone="accent">{{ entry.phase }}</AppBadge>
              <AppLocalizedText :text="entry.note" />
            </li>
          </ul>
        </section>
      </template>

      <template v-else-if="activeTab === 'detail'">
        <p
          v-if="!point.detail.rows.length && !point.detail.endpoints.length"
          class="text-sm text-content-muted"
        >
          {{ t('screen.detailDesign.empty') }}
        </p>
        <div
          v-if="point.detail.rows.length"
          class="overflow-x-auto rounded-control border border-line"
        >
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-surface-muted text-left text-xs font-semibold text-content-muted">
                <th
                  scope="col"
                  class="w-2/5 px-3 py-2"
                >
                  {{ t('screen.detailDesign.item') }}
                </th>
                <th
                  scope="col"
                  class="px-3 py-2"
                >
                  {{ t('screen.detailDesign.spec') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in point.detail.rows"
                :key="index"
                class="border-t border-line align-top"
              >
                <th
                  scope="row"
                  class="px-3 py-2 text-left font-medium"
                >
                  <AppLocalizedText :text="row.item" />
                </th>
                <td class="px-3 py-2">
                  <AppLocalizedText :text="row.spec" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <section
          v-if="point.detail.endpoints.length"
          class="flex flex-col gap-2"
        >
          <h3 class="text-xs font-semibold tracking-wider text-content-muted uppercase">{{ t('screen.detailDesign.endpoints') }}</h3>
          <ul class="flex flex-col gap-1">
            <li
              v-for="endpoint in point.detail.endpoints"
              :key="endpoint"
              class="font-mono text-xs [overflow-wrap:anywhere]"
            >
              {{ endpoint }}
            </li>
          </ul>
        </section>
      </template>

      <template v-else-if="activeTab === 'tests'">
        <p
          v-if="!point.tests.length"
          class="text-sm text-content-muted"
        >
          {{ t('screen.tests.empty') }}
        </p>
        <section
          v-for="(testCase, index) in point.tests"
          :key="index"
          class="flex flex-col gap-2 rounded-control border border-line p-4"
        >
          <h3 class="text-sm font-semibold">{{ t('screen.tests.caseLabel', { number: index + 1 }) }}</h3>
          <dl class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm leading-relaxed">
            <dt class="font-semibold text-content-muted">{{ t('screen.tests.given') }}</dt>
            <dd><AppLocalizedText :text="testCase.given" /></dd>
            <dt class="font-semibold text-content-muted">{{ t('screen.tests.when') }}</dt>
            <dd><AppLocalizedText :text="testCase.when" /></dd>
            <dt class="font-semibold text-content-muted">{{ t('screen.tests.then') }}</dt>
            <dd><AppLocalizedText :text="testCase.then" /></dd>
          </dl>
        </section>
      </template>

      <template v-else-if="activeTab === 'impact'">
        <section
          v-if="point.concepts.length"
          class="flex flex-col gap-2"
        >
          <h3 class="text-xs font-semibold tracking-wider text-content-muted uppercase">{{ t('screen.impact.concepts') }}</h3>
          <ul class="flex flex-col gap-2">
            <li
              v-for="concept in point.concepts"
              :key="concept.key"
              class="rounded-control bg-accent-soft px-3 py-2.5 text-sm"
            >
              <AppLocalizedText
                :text="concept.name"
                as="p"
                class="font-semibold text-accent-strong"
              />
              <AppLocalizedText
                :text="concept.description"
                as="p"
              />
              <div
                v-if="concept.alsoUsedIn.length"
                class="mt-1.5 text-xs text-content-muted"
              >
                <p class="font-semibold">{{ t('screen.impact.alsoUsedIn') }}</p>
                <ul class="list-disc pl-4">
                  <li
                    v-for="(place, index) in concept.alsoUsedIn"
                    :key="index"
                  >
                    <AppLocalizedText :text="place" />
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-xs font-semibold tracking-wider text-content-muted uppercase">{{ t('screen.impact.dependsOn') }}</h3>
          <ul
            v-if="point.dependsOn.length"
            class="flex flex-col gap-1.5"
          >
            <li
              v-for="link in point.dependsOn"
              :key="linkKey(link)"
            >
              <NuxtLink
                :to="toLinkTarget(link)"
                class="text-sm break-words text-accent hover:text-accent-strong"
                >← {{ linkLabel(link) }}</NuxtLink
              >
            </li>
          </ul>
          <p
            v-else
            class="text-sm text-content-muted"
          >
            {{ t('screen.impact.dependsOnEmpty') }}
          </p>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-xs font-semibold tracking-wider text-content-muted uppercase">{{ t('screen.impact.dependedOnBy') }}</h3>
          <ul
            v-if="downstream.length"
            class="flex flex-col gap-1.5"
          >
            <li
              v-for="link in downstream"
              :key="linkKey(link)"
            >
              <NuxtLink
                :to="toLinkTarget(link)"
                class="text-sm break-words text-accent hover:text-accent-strong"
                >→ {{ linkLabel(link) }}</NuxtLink
              >
            </li>
          </ul>
          <p
            v-else
            class="text-sm text-content-muted"
          >
            {{ t('screen.impact.affectsEmpty') }}
          </p>
        </section>

        <section
          v-if="sharedConcept.length"
          class="flex flex-col gap-2"
        >
          <h3 class="text-xs font-semibold tracking-wider text-content-muted uppercase">{{ t('screen.impact.sharedConcept') }}</h3>
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="link in sharedConcept"
              :key="linkKey(link)"
              class="flex min-w-0 flex-wrap items-baseline gap-x-2"
            >
              <NuxtLink
                :to="toLinkTarget(link)"
                class="text-sm break-words text-accent hover:text-accent-strong"
                >↔ {{ linkLabel(link) }}</NuxtLink
              >
              <span
                v-if="link.conceptName"
                class="text-xs text-content-muted"
                >{{ t('screen.impact.viaConcept', { concept: resolve(link.conceptName) }) }}</span
              >
            </li>
          </ul>
        </section>
      </template>

      <template v-else>
        <DiscussionThread
          :comments="point.comments"
          :empty-label="t('screen.comments.empty')"
        />
        <form
          class="flex flex-col gap-2"
          @submit.prevent="handleCommentSubmit"
        >
          <label
            :for="`${idPrefix}-comment`"
            class="text-sm font-medium"
            >{{ t('screen.comments.write') }}</label
          >
          <MentionTextarea
            :id="`${idPrefix}-comment`"
            v-model="draftComment"
            :people="people ?? []"
            :placeholder="t('screen.comments.placeholder')"
            @update:mentions="draftMentions = $event"
          />
          <p class="text-xs text-content-muted">{{ t('screen.comments.mentionHint') }}</p>
          <p
            v-if="commentError"
            role="alert"
            class="text-sm text-danger"
          >
            {{ commentError }}
          </p>
          <AppButton
            type="submit"
            class="self-end"
            :is-disabled="isCommentPending || !draftComment.trim()"
            >{{ t('common.actions.send') }}</AppButton
          >
        </form>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import DiscussionThread from '@/components/discussion/DiscussionThread.vue';
import MentionTextarea from '@/components/discussion/MentionTextarea.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import AppTabs from '@/components/ui/AppTabs.vue';
import { CONTENT_LANGUAGE_KEY, DEFAULT_CONTENT_VIEW, resolveLocalizedText } from '@/utils/content-language';
import type { PointTab } from '@/utils/point-tabs';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { UserOption } from '~~/shared/contracts/member';
import type { PointLink, ScreenPoint } from '~~/shared/contracts/screen';

const props = defineProps<{
  point: ScreenPoint;
  activeTab: PointTab;
  /** Locale-aware project root that point links are appended to. */
  projectPath: string;
  isCommentPending?: boolean;
  commentError?: string;
  /** Increases after each accepted comment, which clears the draft. */
  commentSavedCount?: number;
  /** Project members who can be tagged with @ in a comment. */
  people?: UserOption[];
}>();

const emit = defineEmits<{ 'update:activeTab': [tab: PointTab]; submitComment: [text: string, mentionIds: number[]] }>();

const { t } = useI18n();
const injected = inject(CONTENT_LANGUAGE_KEY, null);
const language = computed(() => injected?.value ?? DEFAULT_CONTENT_VIEW);
const idPrefix = useId();

const draftComment = ref<string>('');
const draftMentions = ref<number[]>([]);

const TAB_TITLE_KEYS: Record<PointTab, string> = {
  basic: 'screen.tabTitles.basic',
  detail: 'screen.tabTitles.detail',
  tests: 'screen.tabTitles.tests',
  impact: 'screen.tabTitles.impact',
  comments: 'screen.tabTitles.comments',
};

const tabs = computed(() => [
  { id: 'basic', label: t('screen.tabs.basic') },
  { id: 'detail', label: t('screen.tabs.detail') },
  { id: 'tests', label: t('screen.tabs.tests'), count: props.point.tests.length },
  { id: 'impact', label: t('screen.tabs.impact'), count: props.point.affects.length },
  { id: 'comments', label: t('screen.tabs.comments'), count: props.point.comments.length },
]);

const downstream = computed(() => props.point.affects.filter((link) => link.reason === 'dependedOnBy'));
const sharedConcept = computed(() => props.point.affects.filter((link) => link.reason === 'sharedConcept'));

function resolve(text: LocalizedText): string {
  return resolveLocalizedText(text, language.value.primary).value;
}

function linkKey(link: PointLink): string {
  return `${link.reason}-${link.screenCode}-${link.number}`;
}

function linkLabel(link: PointLink): string {
  return t('screen.impact.linkLabel', { screen: resolve(link.screenName), number: link.number, title: resolve(link.title) });
}

function toLinkTarget(link: PointLink): string {
  return `${props.projectPath}/${link.screenCode}?point=${link.number}`;
}

function handleCommentSubmit(): void {
  const text = draftComment.value.trim();

  if (text) {
    emit('submitComment', text, draftMentions.value);
  }
}

watch(
  () => props.commentSavedCount,
  () => {
    draftComment.value = '';
  },
);
</script>
