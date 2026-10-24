<template>
  <AppDialog
    :open="open"
    icon="info"
    :title="t('plan.note.dialogTitle', { name: itemName })"
    :is-dirty="isDirty"
    @update:open="emit('update:open', $event)"
  >
    <form
      v-if="canEdit"
      class="flex flex-col gap-3"
      @submit.prevent="handleSave"
    >
      <label
        class="text-sm font-semibold"
        :for="noteId"
        >{{ t('plan.note.title') }}</label
      >
      <textarea
        :id="noteId"
        v-model="draft"
        rows="8"
        :maxlength="NOTE_MAX_LENGTH"
        :placeholder="t('plan.note.placeholder')"
        class="w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs text-content-muted tabular-nums">{{ draft.length }} / {{ NOTE_MAX_LENGTH }}</span>
        <span class="flex gap-2">
          <AppButton
            variant="secondary"
            :is-disabled="!isDirty || isSaving"
            @click="draft = note ?? ''"
            >{{ t('common.unsaved.discard') }}</AppButton
          >
          <AppButton
            type="submit"
            :is-disabled="!isDirty || isSaving"
            >{{ isSaving ? t('common.actions.saving') : t('plan.note.save') }}</AppButton
          >
        </span>
      </div>
    </form>
    <p
      v-else-if="note"
      class="text-sm leading-relaxed whitespace-pre-line"
    >
      {{ note }}
    </p>
    <p
      v-else
      class="text-sm text-content-muted"
    >
      {{ t('plan.note.empty') }}
    </p>
  </AppDialog>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppDialog from '@/components/ui/AppDialog.vue';

// The full note of one feature in a popup, opened from its ⓘ button in the chart; editable for
// people who may change the plan.
const NOTE_MAX_LENGTH = 2_000;

const props = defineProps<{ open: boolean; itemName: string; note: string | null; canEdit: boolean; isSaving?: boolean }>();

const emit = defineEmits<{ 'update:open': [isOpen: boolean]; save: [note: string | null] }>();

const { t } = useI18n();
const noteId = useId();
const draft = ref('');
const isDirty = computed(() => draft.value.trim() !== (props.note ?? '').trim());

watch(
  () => [props.open, props.note],
  () => (draft.value = props.note ?? ''),
  { immediate: true },
);

function handleSave(): void {
  emit('save', draft.value.trim() || null);
}
</script>
