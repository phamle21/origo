<template>
  <div class="flex flex-col gap-3">
    <div
      role="radiogroup"
      :aria-label="t('editor.source.label')"
      class="flex flex-wrap gap-1 rounded-control bg-neutral-soft p-1"
    >
      <label
        v-for="option in KIND_OPTIONS"
        :key="option.kind"
        class="flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-control px-3 text-sm whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
        :class="kind === option.kind ? 'bg-surface font-semibold text-accent-strong shadow-sm' : 'text-content-muted hover:text-content'"
      >
        <input
          type="radio"
          name="screen-source-kind"
          class="sr-only"
          :value="option.kind"
          :checked="kind === option.kind"
          @change="selectKind(option.kind)"
        />
        {{ t(option.labelKey) }}
      </label>
    </div>

    <EditorImageInput
      v-if="kind === 'image'"
      :model-value="imageFile"
      @update:model-value="handleImage"
    />

    <div
      v-else-if="kind === 'html'"
      class="flex flex-col gap-1.5 rounded-card border-2 border-dashed border-line-strong bg-surface px-4 py-5 text-sm"
    >
      <label class="flex flex-col gap-2">
        <span>{{ t('editor.source.htmlHint') }}</span>
        <input
          type="file"
          :accept="SCREEN_EDITOR_LIMITS.htmlExtensions.join(',')"
          class="text-sm file:mr-3 file:min-h-9 file:rounded-control file:border file:border-line file:bg-surface file:px-3 file:text-sm file:font-medium"
          @change="handleHtml"
        />
      </label>
      <span
        v-if="htmlFile"
        class="text-xs [overflow-wrap:anywhere] text-content-muted"
        >{{ htmlFile.name }}</span
      >
    </div>

    <label
      v-else
      class="flex flex-col gap-1 text-sm font-medium"
    >
      {{ t('editor.source.url') }}
      <input
        type="url"
        :value="url"
        inputmode="url"
        placeholder="https://"
        :maxlength="SCREEN_EDITOR_LIMITS.maxUrlLength"
        class="min-h-10 rounded-control border border-line-strong bg-surface px-3 font-mono text-sm font-normal focus:border-accent focus:outline-none"
        @input="handleUrl(($event.target as HTMLInputElement).value)"
      />
      <span class="text-xs font-normal text-content-muted">{{ t('editor.source.urlHint') }}</span>
    </label>

    <label
      v-if="kind !== 'image'"
      class="flex flex-col gap-1 text-sm font-medium"
    >
      {{ t('editor.source.width') }}
      <AppSelect
        :model-value="width"
        class="w-full font-normal"
        :options="WIDTH_OPTIONS.map((option) => ({ value: option.width, label: t(option.labelKey, { width: option.width }) }))"
        @update:model-value="handleWidth(Number($event))"
      />
    </label>

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
import AppSelect from '@/components/ui/AppSelect.vue';
import EditorImageInput from '@/components/editor/EditorImageInput.vue';
import { SCREEN_EDITOR_LIMITS, SCREEN_RENDER_WIDTHS, type ScreenRenderWidth, type ScreenSourceInput } from '~~/shared/contracts/screen-editor';

type SourceKind = ScreenSourceInput['kind'];

const KIND_OPTIONS: { kind: SourceKind; labelKey: string }[] = [
  { kind: 'image', labelKey: 'editor.source.kindImage' },
  { kind: 'html', labelKey: 'editor.source.kindHtml' },
  { kind: 'url', labelKey: 'editor.source.kindUrl' },
];
const WIDTH_LABEL_KEYS: Record<ScreenRenderWidth, string> = {
  1440: 'editor.source.widthDesktop',
  1024: 'editor.source.widthTablet',
  390: 'editor.source.widthPhone',
};
const WIDTH_OPTIONS = SCREEN_RENDER_WIDTHS.map((width) => ({ width, labelKey: WIDTH_LABEL_KEYS[width] }));

defineProps<{ modelValue: ScreenSourceInput | null }>();

const emit = defineEmits<{ 'update:modelValue': [source: ScreenSourceInput | null] }>();

const { t } = useI18n();

// Each kind keeps what was entered, so switching back and forth does not lose a chosen file or URL.
const kind = ref<SourceKind>('image');
const imageFile = ref<File | null>(null);
const htmlFile = ref<File | null>(null);
const url = ref<string>('');
const width = ref<ScreenRenderWidth>(SCREEN_RENDER_WIDTHS[0]);
const errorKey = ref<string | null>(null);

function currentSource(): ScreenSourceInput | null {
  if (kind.value === 'image') {
    return imageFile.value ? { kind: 'image', file: imageFile.value } : null;
  }

  if (kind.value === 'html') {
    return htmlFile.value ? { kind: 'html', file: htmlFile.value, width: width.value } : null;
  }

  return /^https?:\/\/\S+$/i.test(url.value.trim()) ? { kind: 'url', url: url.value.trim(), width: width.value } : null;
}

function publish(): void {
  emit('update:modelValue', currentSource());
}

function selectKind(next: SourceKind): void {
  kind.value = next;
  errorKey.value = null;
  publish();
}

function handleImage(file: File | null): void {
  imageFile.value = file;
  publish();
}

function handleHtml(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null;
  const isHtml = file !== null && SCREEN_EDITOR_LIMITS.htmlExtensions.some((extension) => file.name.toLowerCase().endsWith(extension));

  if (file && (!isHtml || file.size > SCREEN_EDITOR_LIMITS.maxImageBytes)) {
    errorKey.value = isHtml ? 'editor.image.tooLarge' : 'editor.source.invalidHtml';
    htmlFile.value = null;
  } else {
    errorKey.value = null;
    htmlFile.value = file;
  }

  publish();
}

function handleUrl(value: string): void {
  url.value = value;
  publish();
}

function handleWidth(value: number): void {
  width.value = (SCREEN_RENDER_WIDTHS as readonly number[]).includes(value) ? (value as ScreenRenderWidth) : SCREEN_RENDER_WIDTHS[0];
  publish();
}
</script>
