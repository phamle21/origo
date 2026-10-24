<template>
  <component
    :is="as"
    aria-hidden="true"
    data-drop-placeholder
    class="p-1"
  >
    <span class="flex h-9 items-center rounded-control border-2 border-dashed border-accent bg-accent-soft/60 px-3 text-xs font-semibold text-accent-strong">
      <span class="sticky left-3 truncate">{{ name ? t('plan.gantt.dropHere', { name }) : t('plan.gantt.dropHereShort') }}</span>
    </span>
  </component>
</template>

<script setup lang="ts">
// The dashed "drop here" box shown while a row is dragged, the size of one row.
withDefaults(defineProps<{ name?: string | null; as?: string }>(), { name: null, as: 'div' });

const { t } = useI18n();
</script>
