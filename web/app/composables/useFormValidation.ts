import type { Ref } from 'vue';
import type { ZodType } from 'zod';
import type { ApiErrorFields } from '~~/shared/contracts/api-error';

const KNOWN_MESSAGES = new Set(['required', 'tooLong', 'tooShort', 'email', 'projectCode', 'mismatch', 'sameAsCurrent', 'endBeforeStart']);

/**
 * Checks a form in the browser with a Zod schema built from `formRules`. A field shows its message
 * once it has been left (touched) or after a submit attempt, so nobody is scolded while typing. When
 * the browser check passes but the API still refuses a field, that reason shows on the same field.
 */
export function useFormValidation(schema: ZodType, values: () => unknown, options: { serverFields?: Readonly<Ref<ApiErrorFields | null>> } = {}) {
  const { t } = useI18n();
  const isSubmitted = ref(false);
  const touched = ref(new Set<string>());

  const result = computed(() => schema.safeParse(values()));
  const issues = computed(() => {
    const byPath = new Map<string, { message: string; minimum?: unknown; maximum?: unknown; params?: { min?: number; max?: number } }>();

    for (const issue of result.value.success ? [] : result.value.error.issues) {
      const path = issue.path.join('.');

      if (!byPath.has(path)) {
        byPath.set(path, issue as { message: string; minimum?: unknown; maximum?: unknown; params?: { min?: number; max?: number } });
      }
    }

    return byPath;
  });

  function error(path: string): string {
    const issue = issues.value.get(path);

    if (issue && (isSubmitted.value || touched.value.has(path))) {
      const key = KNOWN_MESSAGES.has(issue.message) ? issue.message : 'invalid';

      return t(`validation.${key}`, { min: Number(issue.minimum ?? issue.params?.min ?? 0), max: Number(issue.maximum ?? issue.params?.max ?? 0) });
    }

    const server = options.serverFields?.value?.[path]?.[0];

    return server ? t(`validation.server.${server}`) : '';
  }

  function touch(path: string): void {
    touched.value = new Set(touched.value).add(path);
  }

  /** Marks the form as submitted and tells whether it may be sent. */
  function validate(): boolean {
    isSubmitted.value = true;

    return result.value.success;
  }

  function reset(): void {
    isSubmitted.value = false;
    touched.value = new Set();
  }

  return { error, touch, validate, reset, isValid: computed(() => result.value.success) };
}
