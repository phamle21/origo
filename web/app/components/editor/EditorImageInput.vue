<template>
  <div class="flex flex-col gap-2">
    <div
      class="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-4 py-8 text-center text-sm transition-colors"
      :class="isDragging ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface'"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="t('editor.image.previewAlt')"
        class="max-h-64 w-auto max-w-full rounded-control border border-line"
      />
      <p>
        {{ t('editor.image.drop') }}
        <label class="cursor-pointer font-semibold text-accent underline underline-offset-2 hover:text-accent-strong">
          {{ t('editor.image.choose') }}
          <input
            type="file"
            :accept="SCREEN_EDITOR_LIMITS.imageTypes.join(',')"
            class="sr-only"
            @change="handleChoose"
          />
        </label>
      </p>
      <p class="text-xs text-content-muted">{{ t('editor.image.hint') }}</p>
    </div>
    <p
      v-if="errorKey"
      role="alert"
      class="text-sm text-danger"
    >
      {{ t(errorKey) }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { SCREEN_EDITOR_LIMITS } from '~~/shared/contracts/screen-editor';

const props = withDefaults(defineProps<{ modelValue: File | null; listensToPaste?: boolean }>(), { listensToPaste: true });

const emit = defineEmits<{ 'update:modelValue': [file: File | null] }>();

const { t } = useI18n();
const isDragging = ref(false);
const errorKey = ref<string | null>(null);
const previewUrl = ref<string | null>(null);

// Checked here for an immediate message; the servers check type and size again.
function accept(file: File | undefined | null): void {
  isDragging.value = false;

  if (!file) {
    return;
  }

  if (!(SCREEN_EDITOR_LIMITS.imageTypes as readonly string[]).includes(file.type)) {
    errorKey.value = 'editor.image.invalidType';
    return;
  }

  if (file.size > SCREEN_EDITOR_LIMITS.maxImageBytes) {
    errorKey.value = 'editor.image.tooLarge';
    return;
  }

  errorKey.value = null;
  emit('update:modelValue', file);
}

function handleDrop(event: DragEvent): void {
  accept(event.dataTransfer?.files[0]);
}

function handleChoose(event: Event): void {
  const input = event.target as HTMLInputElement;

  accept(input.files?.[0]);
  input.value = '';
}

// A screenshot tool puts the image on the clipboard, so pasting is the fastest way to add one.
function handlePaste(event: ClipboardEvent): void {
  const file = [...(event.clipboardData?.files ?? [])].find((item) => item.type.startsWith('image/'));

  if (file) {
    event.preventDefault();
    accept(file);
  }
}

watch(
  () => props.modelValue,
  (file) => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }

    previewUrl.value = file ? URL.createObjectURL(file) : null;
  },
);

onMounted(() => {
  if (props.listensToPaste) {
    window.addEventListener('paste', handlePaste);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste);

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>
