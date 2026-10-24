import { z } from 'zod';
import { CONTENT_LOCALE_PATTERN, MAX_CONTENT_LANGUAGES, type LocalizedText } from '~~/shared/contracts/content';
import { SCREEN_EDITOR_LIMITS } from '~~/shared/contracts/screen-editor';

// Mirrors the API's validation so the editor gets field errors from this server first; the API still
// validates again because it is the owner of the data.
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

// Any configured language code may carry text; the API checks the codes against its own list.
export const localizedTextSchema = (max: number, isRequired = false) =>
  z
    .record(z.string().regex(CONTENT_LOCALE_PATTERN), text(max))
    .refine((value) => Object.keys(value).length <= MAX_CONTENT_LANGUAGES, { message: 'tooMany' })
    .transform((value): LocalizedText => ({ vi: null, ...value }))
    .refine((value) => !isRequired || value.vi !== null, { path: ['vi'], message: 'required' });

/** Collects multipart fields such as `name.vi`, `name.ja` back into one localized text. */
export function collectLocalizedFields(fields: Record<string, string>, field: string): Record<string, string> {
  const prefix = `${field}.`;

  return Object.fromEntries(
    Object.entries(fields)
      .filter(([name]) => name.startsWith(prefix))
      .map(([name, value]) => [name.slice(prefix.length), value]),
  );
}

export const screenTextsSchema = z.object({
  name: localizedTextSchema(120, true),
  flow: localizedTextSchema(120),
  purpose: localizedTextSchema(1_000),
});

const percent = z.number().min(0).max(100);

export const pointsPayloadSchema = z.object({
  points: z
    .array(
      z.object({
        id: z.string().max(40).nullable(),
        box: z.tuple([percent, percent, percent, percent]),
        title: localizedTextSchema(200, true),
        basic: z.object({ summary: localizedTextSchema(2_000), rules: z.array(localizedTextSchema(1_000, true)).max(30) }),
        detail: z.object({
          rows: z.array(z.object({ item: localizedTextSchema(200, true), spec: localizedTextSchema(2_000) })).max(50),
          endpoints: z.array(z.string().trim().min(1).max(200)).max(20),
        }),
        tests: z
          .array(z.object({ given: localizedTextSchema(1_000, true), when: localizedTextSchema(1_000, true), then: localizedTextSchema(1_000, true) }))
          .max(50),
        history: z.array(z.object({ phase: z.string().trim().min(1).max(40), note: localizedTextSchema(1_000, true) })).max(30),
        concepts: z.array(z.string().max(80)).max(20),
        dependsOn: z.array(z.string().max(40)).max(30),
      }),
    )
    .max(SCREEN_EDITOR_LIMITS.maxPoints),
});

export const conceptPayloadSchema = z.object({
  name: localizedTextSchema(120, true),
  description: localizedTextSchema(1_000),
});

export const commentPayloadSchema = z.object({
  text: z.string().trim().min(1).max(2_000),
  mentionIds: z.array(z.number().int().positive()).max(20).default([]),
});
