<template>
  <div
    v-if="comments.length"
    class="flex flex-col gap-4"
  >
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="flex min-w-0 gap-3"
    >
      <AppAvatar :initials="comment.authorInitials" />
      <div class="flex min-w-0 flex-col gap-0.5">
        <p class="text-sm break-words">
          <strong class="font-semibold">{{ comment.author }}</strong>
          <span class="text-content-muted"> · {{ comment.role }} · {{ formatDisplayDateTime(comment.at, locale) }}</span>
        </p>
        <p class="text-sm leading-relaxed break-words whitespace-pre-line">
          <template
            v-for="(segment, index) in splitMentions(comment.text, comment.mentions)"
            :key="index"
          >
            <mark
              v-if="segment.mentionId"
              class="rounded bg-accent-soft px-0.5 font-semibold text-accent-strong"
              >{{ segment.text }}</mark
            >
            <template v-else>{{ segment.text }}</template>
          </template>
        </p>
      </div>
    </div>
  </div>
  <p
    v-else
    class="text-sm text-content-muted"
  >
    {{ emptyLabel }}
  </p>
</template>

<script setup lang="ts">
import AppAvatar from '@/components/ui/AppAvatar.vue';
import { formatDisplayDateTime } from '@/utils/format';
import { splitMentions } from '@/utils/mentions';
import type { PointComment } from '~~/shared/contracts/screen';

defineProps<{
  comments: PointComment[];
  emptyLabel: string;
}>();

const { locale } = useI18n();
</script>
