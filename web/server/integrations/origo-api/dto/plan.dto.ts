import { z } from 'zod';
import { localizedTextDtoSchema } from './localized-text.dto';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const category = z.enum(['todo', 'doing', 'done']);
const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullish().transform((value) => value ?? null);

const effortSchema = z.object({
  estimateDays: z.number(),
  actualDays: z.number(),
  remainingDays: z.number(),
  progress: z.number().nullable(),
  basis: z.enum(['effort', 'count']),
});

export const projectPlanDtoSchema = z.object({
  data: z.object({
    canEdit: z.boolean(),
    stages: z.array(
      z.object({
        id: z.string(),
        key: z.string(),
        name: localizedTextDtoSchema,
        color,
        startDate: nullable(isoDate),
        endDate: nullable(isoDate),
        owner: nullable(z.string()),
      }),
    ),
    statuses: z.array(z.object({ id: z.string(), name: localizedTextDtoSchema, category, color })).default([]),
    items: z.array(
      z.object({
        id: z.string(),
        parentId: z.string().nullable(),
        kind: z.enum(['phase', 'module', 'feature']),
        name: localizedTextDtoSchema,
        note: nullable(z.string()),
        priority: nullable(z.number().int()),
        position: z.number().int(),
        screenCodes: z.array(z.string()).default([]),
      }),
    ),
    tasks: z.array(
      z.object({
        id: z.string(),
        itemId: z.string(),
        stageId: z.string(),
        startDate: isoDate,
        endDate: isoDate,
        status: category,
        statusId: nullable(z.string()),
        assigneeId: z.number().int().nullable(),
        estimateDays: nullable(z.number()),
        progress: nullable(z.number().int()),
        link: nullable(z.string()),
        note: nullable(z.string()),
      }),
    ),
    summary: z.object({
      today: isoDate,
      overall: effortSchema.extend({
        startDate: isoDate.nullable(),
        endDate: isoDate.nullable(),
        workingDays: z.number().int().nullable(),
        workingDaysPassed: z.number().int().nullable(),
        timeElapsed: z.number().nullable(),
        taskCount: z.number().int(),
        doneCount: z.number().int(),
      }),
      stages: z.array(
        effortSchema.extend({
          stageId: z.string(),
          owner: z.string().nullable(),
          startDate: isoDate.nullable(),
          endDate: isoDate.nullable(),
          workingDays: z.number().int().nullable(),
          isLate: z.boolean(),
        }),
      ),
    }),
  }),
});

export const createdItemDtoSchema = z.object({ data: z.object({ id: z.string() }) });

const snapshotSchema = z.object({
  overall: effortSchema.extend({ timeElapsed: z.number().nullable(), doneCount: z.number().int(), taskCount: z.number().int() }),
  stages: z.array(effortSchema.extend({ stageId: z.string(), name: localizedTextDtoSchema })),
});

export const planWeeklyDtoSchema = z.object({
  data: z.object({
    canEdit: z.boolean(),
    currentWeek: isoDate,
    members: z.array(z.object({ id: z.number().int(), name: z.string(), title: z.string().nullable() })),
    weeks: z.array(
      z.object({
        weekStart: isoDate,
        snapshot: snapshotSchema.nullable(),
        snapshotAt: z.string().nullable(),
        summary: localizedTextDtoSchema.nullable(),
        // PHP sends an empty map as [].
        hours: z.union([z.record(z.string(), z.number()), z.array(z.never()).transform(() => ({}))]),
      }),
    ),
  }),
});

export const workCalendarDtoSchema = z.object({
  data: z.array(z.object({ date: isoDate, kind: z.enum(['holiday', 'workday']), name: z.string().nullable() })),
});

export const planTemplateDtoSchema = z.object({
  data: z
    .object({
      originalName: z.string(),
      uploadedAt: z.string(),
      uploadedBy: z.object({ id: z.number().int(), name: z.string() }),
      ganttSheet: z.string(),
      candidates: z.array(z.string()),
      weeklySheet: z.string().nullable(),
      warnings: z.array(z.string()),
    })
    .nullable(),
});
