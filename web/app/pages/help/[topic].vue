<template>
  <AppTopbar :crumbs="[{ label: t('help.title'), to: localePath('/help') }, { label: t(`help.topics.${topic.id}.title`) }]" />

  <div class="grid w-full grid-cols-1 items-start gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
    <nav
      :aria-label="t('help.stepsLabel')"
      class="flex flex-col gap-1 rounded-card border border-line bg-surface p-2 shadow-card lg:sticky lg:top-16"
    >
      <NuxtLink
        :to="localePath('/help')"
        class="mb-1 flex min-h-9 items-center gap-2 rounded-control px-2.5 text-sm font-semibold text-content-muted hover:bg-surface-muted hover:text-content focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">←</span>
        {{ t('help.backToList') }}
      </NuxtLink>
      <p class="px-2.5 pt-1 pb-1.5 text-xs font-semibold tracking-wide text-content-muted uppercase">
        {{ t('help.lessonNumber', { number: topicIndex + 1 }) }} · {{ t(`help.topics.${topic.id}.title`) }}
      </p>
      <ol class="flex flex-col gap-0.5">
        <li
          v-for="(step, index) in topic.steps"
          :key="step.id"
        >
          <a
            :href="`#step-${step.id}`"
            :aria-current="step.id === currentStepId ? 'step' : undefined"
            :class="[
              'flex min-h-9 items-center gap-2.5 rounded-control px-2.5 py-1 text-sm focus-visible:outline-2 focus-visible:outline-accent',
              step.id === currentStepId ? 'bg-accent font-semibold text-accent-contrast' : 'hover:bg-surface-muted',
            ]"
            @click.prevent="goToStep(step.id)"
          >
            <span
              :class="[
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                step.id === currentStepId ? 'bg-accent-contrast text-accent-strong' : 'bg-neutral-soft text-content-muted',
              ]"
              >{{ index + 1 }}</span
            >
            {{ stepText(step.id, 'title') }}
          </a>
        </li>
      </ol>
    </nav>

    <article class="flex min-w-0 flex-col gap-6">
      <header class="flex flex-col gap-2">
        <p class="text-sm font-semibold text-accent-strong">{{ t('help.lessonNumber', { number: topicIndex + 1 }) }}</p>
        <h1 class="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <AppTileIcon :name="topic.tile" />
          {{ t(`help.topics.${topic.id}.title`) }}
        </h1>
        <p class="text-lg text-content-muted">{{ t(`help.topics.${topic.id}.summary`) }}</p>
        <p
          v-if="topic.audience"
          class="pt-1"
        >
          <AppBadge :tone="topic.audience === 'admins' ? 'warning' : 'info'">{{ t(`help.audience.${topic.audience}`) }}</AppBadge>
        </p>
      </header>

      <ol class="flex flex-col gap-5">
        <li
          v-for="(step, index) in topic.steps"
          :id="`step-${step.id}`"
          :key="step.id"
          class="grid scroll-mt-4 grid-cols-1 gap-4 rounded-card border border-line bg-surface p-5 shadow-card xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
        >
          <div class="flex min-w-0 flex-col gap-3">
            <h2 class="flex items-center gap-3 text-xl font-bold">
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg text-accent-contrast"
                :aria-label="t('help.stepNumber', { number: index + 1 })"
                >{{ index + 1 }}</span
              >
              {{ stepText(step.id, 'title') }}
            </h2>
            <p class="text-base leading-relaxed">{{ stepText(step.id, 'text') }}</p>
            <p
              v-if="step.hasTip"
              class="rounded-control bg-warning-soft px-3 py-2 text-sm text-content"
            >
              <span class="mr-1 font-bold whitespace-nowrap text-warning">💡 {{ t('help.tip') }}:</span>
              {{ stepText(step.id, 'tip') }}
            </p>
          </div>
          <button
            v-if="step.image"
            type="button"
            class="group relative block cursor-zoom-in overflow-hidden rounded-card border-4 border-line-strong bg-surface-muted shadow-card hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            :aria-label="`${t('help.imageAlt', { title: stepText(step.id, 'title') })}. ${t('help.zoom')}`"
            @click="showFullscreen($event)"
          >
            <img
              :src="step.image"
              :alt="t('help.imageAlt', { title: stepText(step.id, 'title') })"
              loading="lazy"
              decoding="async"
              class="block h-auto w-full cursor-zoom-in [&:fullscreen]:cursor-zoom-out [&:fullscreen]:bg-black [&:fullscreen]:object-contain"
            />
          </button>
        </li>
      </ol>

      <nav
        :aria-label="t('help.topicsLabel')"
        class="flex flex-wrap justify-between gap-3 border-t border-line pt-5"
      >
        <NuxtLink
          v-if="previous"
          :to="localePath(`/help/${previous.id}`)"
          class="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-surface px-4 text-sm font-semibold hover:border-accent hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true">←</span>
          <span class="flex flex-col text-left">
            <span class="text-xs font-normal text-content-muted">{{ t('help.previous') }}</span>
            {{ t(`help.topics.${previous.id}.title`) }}
          </span>
        </NuxtLink>
        <span v-else />
        <NuxtLink
          v-if="next"
          :to="localePath(`/help/${next.id}`)"
          class="inline-flex min-h-11 items-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-accent-contrast hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span class="flex flex-col text-right">
            <span class="text-xs font-normal opacity-80">{{ t('help.next') }}</span>
            {{ t(`help.topics.${next.id}.title`) }}
          </span>
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </nav>
    </article>
  </div>
</template>

<script setup lang="ts">
import AppTopbar from '@/components/layout/AppTopbar.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';
import { findHelpTopic, HELP_TOPICS } from '@/utils/help-topics';

const { t } = useI18n();
const route = useRoute();
const localePath = useLocalePath();

const found = findHelpTopic(String(route.params.topic ?? ''));

if (!found) {
  throw createError({ statusCode: 404, fatal: true });
}

const topic = computed(() => findHelpTopic(String(route.params.topic ?? '')) ?? found);
const topicIndex = computed(() => HELP_TOPICS.findIndex((item) => item.id === topic.value.id));
const previous = computed(() => HELP_TOPICS[topicIndex.value - 1] ?? null);
const next = computed(() => HELP_TOPICS[topicIndex.value + 1] ?? null);

// A picture opens full screen (black around it); a click or Esc closes it. Without the full-screen API
// the picture opens on its own in a new tab instead.
async function showFullscreen(event: MouseEvent): Promise<void> {
  const image = (event.currentTarget as HTMLElement).querySelector('img');

  if (!image) {
    return;
  }
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => undefined);
  } else if (document.fullscreenEnabled) {
    await image.requestFullscreen().catch(() => undefined);
  } else {
    window.open(image.src, '_blank', 'noopener');
  }
}

// The menu follows the reading: the step nearest the top of the window is marked as the current one.
const currentStepId = ref<string | null>(found.steps[0]?.id ?? null);
let observer: IntersectionObserver | null = null;

function goToStep(stepId: string): void {
  currentStepId.value = stepId;
  document.getElementById(`step-${stepId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(history.state, '', `#step-${stepId}`);
}

function watchSteps(): void {
  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

      if (visible) {
        currentStepId.value = visible.target.id.replace(/^step-/, '');
      }
    },
    { rootMargin: '-15% 0px -60% 0px' },
  );
  topic.value.steps.forEach((step) => {
    const element = document.getElementById(`step-${step.id}`);

    if (element) {
      observer?.observe(element);
    }
  });
}

onMounted(() => {
  watchSteps();

  const fromHash = window.location.hash.replace(/^#step-/, '');

  if (topic.value.steps.some((step) => step.id === fromHash)) {
    goToStep(fromHash);
  }
});
watch(
  () => topic.value.id,
  async () => {
    currentStepId.value = topic.value.steps[0]?.id ?? null;
    await nextTick();
    watchSteps();
  },
);
onBeforeUnmount(() => observer?.disconnect());

function stepText(stepId: string, part: 'title' | 'text' | 'tip'): string {
  return t(`help.topics.${topic.value.id}.steps.${stepId}.${part}`);
}

useSeoMeta({ title: () => `${t(`help.topics.${topic.value.id}.title`)} · ${t('help.title')}` });
</script>
