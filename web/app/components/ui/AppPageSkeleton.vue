<template>
  <div
    role="status"
    aria-live="polite"
    class="flex w-full flex-col gap-4"
  >
    <span class="sr-only">{{ t('common.states.loading') }}</span>

    <!-- Project cards -->
    <ul
      v-if="variant === 'cards'"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="card in 6"
        :key="card"
        class="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-card"
      >
        <AppSkeleton class="h-4 w-20" />
        <AppSkeleton class="h-6 w-3/4" />
        <AppSkeleton class="h-4 w-full" />
        <div class="flex gap-2 pt-2">
          <AppSkeleton class="h-9 w-24" />
          <AppSkeleton class="h-9 w-24" />
        </div>
      </li>
    </ul>

    <!-- A table or a list of rows in a card -->
    <section
      v-else-if="variant === 'table' || variant === 'list'"
      class="flex flex-col rounded-card border border-line bg-surface shadow-card"
    >
      <div class="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <AppSkeleton class="h-6 w-40" />
        <AppSkeleton class="h-10 w-full max-w-80" />
      </div>
      <div
        v-for="row in rows"
        :key="row"
        class="flex items-center gap-4 border-b border-line px-6 py-3 last:border-b-0"
      >
        <AppSkeleton
          v-if="variant === 'list'"
          class="size-9 shrink-0 rounded-full!"
        />
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <AppSkeleton :class="['h-4', row % 2 ? 'w-1/3' : 'w-1/2']" />
          <AppSkeleton class="h-3 w-1/4" />
        </div>
        <AppSkeleton class="hidden h-6 w-20 sm:block" />
        <AppSkeleton class="h-9 w-24" />
      </div>
    </section>

    <!-- Rows only, inside a card the page already shows -->
    <div v-else-if="variant === 'rows'">
      <div
        v-for="row in rows"
        :key="row"
        class="flex items-center gap-4 border-b border-line px-6 py-3 last:border-b-0"
      >
        <AppSkeleton class="size-9 shrink-0 rounded-full!" />
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <AppSkeleton :class="['h-4', row % 2 ? 'w-1/3' : 'w-1/2']" />
          <AppSkeleton class="h-3 w-1/4" />
        </div>
        <AppSkeleton class="h-9 w-24" />
      </div>
    </div>

    <!-- A settings form with numbered sections -->
    <section
      v-else-if="variant === 'form'"
      class="flex max-w-5xl flex-col gap-6 rounded-card border border-line bg-surface p-6 shadow-card"
    >
      <div class="flex items-center gap-3">
        <AppSkeleton class="size-11 shrink-0" />
        <div class="flex flex-1 flex-col gap-2">
          <AppSkeleton class="h-6 w-1/3" />
          <AppSkeleton class="h-4 w-2/3" />
        </div>
      </div>
      <div
        v-for="section in 2"
        :key="section"
        class="flex flex-col gap-3 border-t border-line pt-5"
      >
        <AppSkeleton class="h-5 w-48" />
        <AppSkeleton
          v-for="field in 3"
          :key="field"
          class="h-12 w-full"
        />
      </div>
    </section>

    <!-- The plan: toolbar, chart rows and the side panel -->
    <div
      v-else-if="variant === 'plan'"
      class="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]"
    >
      <div class="flex min-w-0 flex-col gap-3">
        <div class="flex items-center gap-2 rounded-card border border-line bg-surface px-3 py-2 shadow-card">
          <AppSkeleton class="h-9 w-36" />
          <AppSkeleton class="h-9 w-28" />
          <AppSkeleton class="ml-auto h-9 w-9" />
        </div>
        <div class="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <div
            v-for="row in 9"
            :key="row"
            class="flex items-center border-b border-line last:border-b-0"
          >
            <div class="flex w-72 shrink-0 items-center gap-2 border-r border-line-strong px-3 py-3">
              <AppSkeleton
                class="h-4"
                :style="{ marginLeft: `${(row % 3) * 16}px`, width: `${50 + ((row * 37) % 40)}%` }"
              />
            </div>
            <div class="relative h-11 flex-1">
              <AppSkeleton
                class="absolute top-3 h-5"
                :style="{ left: `${(row * 13) % 50}%`, width: `${15 + ((row * 23) % 30)}%` }"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-card">
        <AppSkeleton class="h-6 w-2/3" />
        <AppSkeleton class="h-4 w-full" />
        <AppSkeleton class="h-24 w-full" />
        <AppSkeleton class="h-10 w-full" />
      </div>
    </div>

    <!-- A screen picture with its numbered points -->
    <div
      v-else
      class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <div class="flex min-w-0 flex-col gap-4">
        <AppSkeleton class="h-8 w-1/2" />
        <AppSkeleton class="h-4 w-3/4" />
        <AppSkeleton class="aspect-video w-full rounded-card!" />
      </div>
      <div class="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-card">
        <div class="flex gap-2">
          <AppSkeleton
            v-for="tab in 3"
            :key="tab"
            class="h-9 w-24"
          />
        </div>
        <AppSkeleton class="h-6 w-2/3" />
        <AppSkeleton class="h-32 w-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSkeleton from '@/components/ui/AppSkeleton.vue';

// Grey shapes in the layout of the page that is loading, so the page appears at once on navigation and
// fills in without jumping. Each variant mirrors one kind of page.
withDefaults(defineProps<{ variant: 'cards' | 'table' | 'list' | 'rows' | 'form' | 'plan' | 'screen'; rows?: number }>(), { rows: 6 });

const { t } = useI18n();
</script>
