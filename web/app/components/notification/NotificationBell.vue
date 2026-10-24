<template>
  <div
    ref="root"
    class="relative"
  >
    <button
      ref="trigger"
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      :aria-label="feed.unreadCount ? t('notification.openUnread', feed.unreadCount) : t('notification.open')"
      class="relative flex size-10 items-center justify-center rounded-full text-content-muted hover:bg-neutral-soft hover:text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      @click="handleToggle"
    >
      <AppIcon name="bell" />
      <span
        v-if="feed.unreadCount"
        aria-hidden="true"
        class="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[0.6875rem] font-bold text-surface tabular-nums"
        >{{ feed.unreadCount > 99 ? '99+' : feed.unreadCount }}</span
      >
    </button>

    <div
      v-if="isOpen"
      :id="panelId"
      class="absolute top-full right-0 z-40 mt-2 flex max-h-[min(36rem,calc(100dvh-5rem))] w-[min(26rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-2xl"
    >
      <header class="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 class="font-semibold">{{ t('notification.title') }}</h2>
        <button
          v-if="feed.unreadCount"
          type="button"
          class="text-xs font-semibold text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-accent"
          @click="markRead()"
        >
          {{ t('notification.markAllRead') }}
        </button>
      </header>
      <p
        v-if="!feed.items.length"
        class="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-content-muted"
      >
        <AppIcon
          name="bell"
          :size="28"
        />
        {{ t('notification.empty') }}
      </p>
      <ul
        v-else
        class="divide-y divide-line overflow-y-auto"
      >
        <li
          v-for="item in feed.items"
          :key="item.id"
        >
          <NuxtLink
            :to="linkOf(item)"
            :class="[
              'flex gap-3 px-4 py-3 text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
              item.isRead ? '' : 'bg-accent-soft/50',
            ]"
            @click="handleOpen(item)"
          >
            <AppAvatar
              :initials="item.actor.initials"
              size="sm"
            />
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="break-words">{{ sentenceOf(item) }}</span>
              <span
                v-if="item.excerpt"
                class="line-clamp-2 rounded-control bg-surface-muted px-2 py-1 text-xs text-content-muted"
                >“{{ item.excerpt }}”</span
              >
              <span class="text-xs text-content-muted">{{ textOf(item.project.name) }} · {{ formatTimeAgo(item.at, locale) }}</span>
            </span>
            <span
              v-if="!item.isRead"
              class="mt-1.5 size-2 shrink-0 rounded-full bg-accent"
              :aria-label="t('notification.unread')"
            />
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppAvatar from '@/components/ui/AppAvatar.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { resolveLocalizedText } from '@/utils/content-language';
import { formatDisplayDate, formatTimeAgo } from '@/utils/format';
import type { LocalizedText } from '~~/shared/contracts/content';
import type { AppNotification } from '~~/shared/contracts/notification';

// The bell in the top bar: a count of unread notifications and, on click, the latest ones. Opening one
// marks it read and goes to the place it is about.
const REFRESH_MILLISECONDS = 60_000;

const { t, locale } = useI18n();
const localePath = useLocalePath();
const { contentLanguage } = useContentLanguage();
const { feed, load, markRead } = useNotifications();
const panelId = useId();
const root = useTemplateRef<HTMLElement>('root');
const trigger = useTemplateRef<HTMLElement>('trigger');
const { isOpen, toggle, close } = useDropdown(root, trigger);
let timer: ReturnType<typeof setInterval> | undefined;

function textOf(text: LocalizedText): string {
  return resolveLocalizedText(text, contentLanguage.value.primary).value;
}

function sentenceOf(item: AppNotification): string {
  const actor = item.actor.name;

  switch (item.kind) {
    case 'mention':
      return t('notification.kinds.mention', { actor, screen: item.screen ? textOf(item.screen.name) : '', number: item.point?.number ?? '' });
    case 'memberAdded':
      return t('notification.kinds.memberAdded', { actor, role: item.role ? textOf(item.role.name) : '' });
    case 'roleChanged':
      return t('notification.kinds.roleChanged', { actor, role: item.role ? textOf(item.role.name) : '' });
    case 'taskAssigned':
      return t('notification.kinds.taskAssigned', {
        actor,
        stage: item.task ? textOf(item.task.stageName) : '',
        item: item.task ? textOf(item.task.itemName) : '',
        start: item.task ? formatDisplayDate(item.task.startDate, locale.value) : '',
        end: item.task ? formatDisplayDate(item.task.endDate, locale.value) : '',
      });
  }

  return actor;
}

function linkOf(item: AppNotification): string | { path: string; query: Record<string, string> } {
  const project = `/p/${item.project.code}`;

  if (item.kind === 'mention' && item.screen) {
    return { path: localePath(`${project}/${item.screen.code}`), query: { point: String(item.point?.number ?? 1), tab: 'comments' } };
  }

  return localePath(item.kind === 'taskAssigned' ? `${project}/plan` : project);
}

async function handleToggle(): Promise<void> {
  toggle();

  if (isOpen.value) {
    await load();
  }
}

function handleOpen(item: AppNotification): void {
  close();

  if (!item.isRead) {
    markRead([item.id]);
  }
}

function refreshWhenVisible(): void {
  if (document.visibilityState === 'visible') {
    load();
  }
}

onMounted(() => {
  load();
  timer = setInterval(refreshWhenVisible, REFRESH_MILLISECONDS);
  document.addEventListener('visibilitychange', refreshWhenVisible);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  document.removeEventListener('visibilitychange', refreshWhenVisible);
});
</script>
