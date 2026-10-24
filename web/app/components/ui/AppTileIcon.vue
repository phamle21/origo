<template>
  <span
    aria-hidden="true"
    :class="['inline-flex shrink-0 items-center justify-center rounded-xl border border-line bg-surface shadow-card', SIZE_CLASSES[size]]"
  >
    <svg
      viewBox="0 0 48 48"
      class="size-[72%]"
    >
      <template v-if="name === 'plan'">
        <rect
          x="7"
          y="10"
          width="22"
          height="7"
          rx="3.5"
          class="fill-accent"
        />
        <rect
          x="15"
          y="20.5"
          width="26"
          height="7"
          rx="3.5"
          class="fill-accent"
        />
        <rect
          x="11"
          y="31"
          width="16"
          height="7"
          rx="3.5"
          class="fill-spark"
        />
        <rect
          x="32.5"
          y="6"
          width="2.5"
          height="36"
          rx="1.25"
          class="fill-spark-strong"
        />
      </template>
      <template v-else-if="name === 'design'">
        <rect
          x="5"
          y="8"
          width="38"
          height="28"
          rx="4"
          class="fill-accent"
        />
        <rect
          x="9"
          y="14"
          width="30"
          height="18"
          rx="2"
          class="fill-surface"
        />
        <rect
          x="12"
          y="17"
          width="12"
          height="3"
          rx="1.5"
          class="fill-tile"
        />
        <rect
          x="12"
          y="23"
          width="9"
          height="3"
          rx="1.5"
          class="fill-tile"
        />
        <circle
          cx="31"
          cy="23"
          r="5"
          class="fill-spark"
        />
        <rect
          x="18"
          y="38"
          width="12"
          height="4"
          rx="2"
          class="fill-accent"
        />
      </template>
      <template v-else-if="name === 'members'">
        <circle
          cx="12"
          cy="18"
          r="5"
          class="fill-spark"
        />
        <circle
          cx="36"
          cy="18"
          r="5"
          class="fill-spark"
        />
        <path
          d="M3 35a9 8 0 0 1 18 0z M27 35a9 8 0 0 1 18 0z"
          class="fill-spark"
        />
        <circle
          cx="24"
          cy="16"
          r="7"
          class="fill-accent"
        />
        <path
          d="M11 40a13 11 0 0 1 26 0z"
          class="fill-accent"
        />
      </template>
      <template v-else-if="name === 'people'">
        <rect
          x="10"
          y="5"
          width="30"
          height="38"
          rx="5"
          class="fill-accent"
        />
        <circle
          cx="25"
          cy="19"
          r="6"
          class="fill-spark"
        />
        <path
          d="M15 35a10 8 0 0 1 20 0z"
          class="fill-spark"
        />
        <rect
          x="6"
          y="12"
          width="7"
          height="3"
          rx="1.5"
          class="fill-spark-strong"
        />
        <rect
          x="6"
          y="22"
          width="7"
          height="3"
          rx="1.5"
          class="fill-spark-strong"
        />
        <rect
          x="6"
          y="32"
          width="7"
          height="3"
          rx="1.5"
          class="fill-spark-strong"
        />
      </template>
      <template v-else-if="name === 'projects'">
        <path
          d="M5 13a4 4 0 0 1 4-4h10l4 5h-18z"
          class="fill-spark"
        />
        <rect
          x="5"
          y="14"
          width="38"
          height="26"
          rx="4"
          class="fill-accent"
        />
        <rect
          x="11"
          y="21"
          width="16"
          height="3.5"
          rx="1.75"
          class="fill-surface"
        />
        <circle
          cx="35"
          cy="31"
          r="4"
          class="fill-spark"
        />
      </template>
      <template v-else-if="name === 'settings'">
        <path
          d="M21 4h6l1 5 4 2 4.5-3 4.2 4.2-3 4.5 2 4 5 1v6l-5 1-2 4 3 4.5-4.2 4.2-4.5-3-4 2-1 5h-6l-1-5-4-2-4.5 3-4.2-4.2 3-4.5-2-4-5-1v-6l5-1 2-4-3-4.5 4.2-4.2 4.5 3 4-2z"
          class="fill-accent"
        />
        <circle
          cx="24"
          cy="24"
          r="7"
          class="fill-spark"
        />
      </template>
      <template v-else-if="name === 'help'">
        <path
          d="M10 6h28a5 5 0 0 1 5 5v19a5 5 0 0 1-5 5H22l-9 8v-8h-3a5 5 0 0 1-5-5V11a5 5 0 0 1 5-5z"
          class="fill-accent"
        />
        <path
          d="M19 16.5a5 5 0 1 1 7.2 4.5c-1.5.8-2.2 1.9-2.2 3.5"
          fill="none"
          stroke-width="3.6"
          stroke-linecap="round"
          class="stroke-spark"
        />
        <circle
          cx="24"
          cy="30"
          r="2.3"
          class="fill-spark"
        />
      </template>
      <template v-else>
        <path
          d="M24 4l17 6v12c0 10-7 18.5-17 21-10-2.5-17-11-17-21V10z"
          class="fill-accent"
        />
        <path
          d="M16 23.5l6 6 11-12"
          fill="none"
          stroke-width="4.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="stroke-spark"
        />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
// Two-colour "app tile" pictures (Origo teal with the logo's amber marker), drawn here for Origo. They
// sit next to page titles and on project shortcuts so a newcomer recognises each area at a glance.
export type AppTileIconName = 'plan' | 'design' | 'members' | 'people' | 'projects' | 'settings' | 'admin' | 'help';

const SIZE_CLASSES = { sm: 'size-9', md: 'size-12', lg: 'size-14', xl: 'size-20' } as const;

withDefaults(defineProps<{ name: AppTileIconName; size?: keyof typeof SIZE_CLASSES }>(), { size: 'md' });
</script>
