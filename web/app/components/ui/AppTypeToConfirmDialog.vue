<template>
  <AppDialog
    :open="open"
    icon="shield"
    :title="title"
    :description="description"
    @update:open="(isOpen) => !isOpen && emit('cancel')"
  >
    <form
      novalidate
      class="flex flex-col gap-4"
      @submit.prevent="handleConfirm"
    >
      <ul
        v-if="consequences.length"
        class="flex flex-col gap-1.5 rounded-control border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-content"
      >
        <li
          v-for="line in consequences"
          :key="line"
          class="flex items-start gap-2"
        >
          <span
            aria-hidden="true"
            class="font-bold text-danger"
            >!</span
          >
          {{ line }}
        </li>
      </ul>
      <label class="flex flex-col gap-1.5 text-sm">
        <!-- The phrase is shown as code so the person copies exactly what is asked. -->
        <i18n-t
          keypath="common.typeToConfirm.label"
          tag="span"
        >
          <template #phrase>
            <code class="rounded bg-neutral-soft px-1.5 py-0.5 font-mono font-bold text-content select-all">{{ phrase }}</code>
          </template>
        </i18n-t>
        <input
          ref="input"
          v-model="typed"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          maxlength="80"
          class="min-h-10 rounded-control border border-line-strong bg-surface px-3 font-mono text-sm focus:border-danger focus:outline-none"
        />
      </label>
      <p
        v-if="error"
        role="alert"
        class="rounded-control bg-danger-soft px-4 py-3 text-sm text-danger"
      >
        {{ error }}
      </p>
      <div class="flex justify-end gap-2 border-t border-line pt-4">
        <AppButton
          variant="secondary"
          @click="emit('cancel')"
          >{{ t('common.actions.cancel') }}</AppButton
        >
        <AppButton
          type="submit"
          variant="danger"
          :is-disabled="!isMatch || isPending"
          >{{ isPending ? t('common.actions.saving') : confirmLabel }}</AppButton
        >
      </div>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import AppDialog from '@/components/ui/AppDialog.vue';

/**
 * For actions that are hard or impossible to undo (archive, delete for good): like GitHub, the button
 * only works once the person has typed the exact phrase, usually the project code.
 */
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    /** What will happen, one short line each. */
    consequences?: string[];
    phrase: string;
    confirmLabel: string;
    isPending?: boolean;
    error?: string;
  }>(),
  { description: undefined, consequences: () => [], isPending: false, error: '' },
);

const emit = defineEmits<{ confirm: [typed: string]; cancel: [] }>();

const { t } = useI18n();
const typed = ref('');
const input = useTemplateRef<HTMLInputElement>('input');
const isMatch = computed(() => typed.value.trim() === props.phrase);

watch(
  () => props.open,
  async (isOpen) => {
    typed.value = '';

    if (isOpen) {
      await nextTick();
      input.value?.focus();
    }
  },
);

function handleConfirm(): void {
  if (isMatch.value && !props.isPending) {
    emit('confirm', typed.value.trim());
  }
}
</script>
