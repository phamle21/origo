import { z } from 'zod';
import { DEFAULT_CONTENT_LOCALE } from '~~/shared/contracts/content';

/**
 * Field rules shared by the forms. Every message is an i18n key under `validation.*`; the form shows
 * it with the limit (min/max) taken from the rule, so the same rule reads well in every language.
 */
export const formRules = {
  requiredText: (max: number) => z.string().trim().min(1, { message: 'required' }).max(max, { message: 'tooLong' }),
  optionalText: (max: number) => z.string().trim().max(max, { message: 'tooLong' }),
  email: () => z.string().trim().min(1, { message: 'required' }).max(255, { message: 'tooLong' }).email({ message: 'email' }),
  password: (min: number) => z.string().min(min, { message: 'tooShort' }).max(255, { message: 'tooLong' }),
  projectCode: () =>
    z
      .string()
      .trim()
      .min(1, { message: 'required' })
      .regex(/^[A-Za-z][A-Za-z0-9]{1,15}$/, { message: 'projectCode' }),
  // Any configured content language; Vietnamese (the default) is the one that can be required.
  localized: (max: number, isRequired: boolean) =>
    z.record(z.string(), z.string().nullable()).superRefine((value, context) => {
      if (isRequired && !value[DEFAULT_CONTENT_LOCALE]?.trim()) {
        context.addIssue({ code: 'custom', path: [DEFAULT_CONTENT_LOCALE], message: 'required' });
      }

      for (const [locale, text] of Object.entries(value)) {
        if ((text?.trim().length ?? 0) > max) {
          context.addIssue({ code: 'custom', path: [locale], message: 'tooLong', params: { max } });
        }
      }
    }),
} as const;
