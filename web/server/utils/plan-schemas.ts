import { z } from 'zod';
import { localizedTextSchema } from './screen-editor-schemas';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const color = z.string().regex(/^#[0-9a-f]{6}$/i);

export const planStagesSchema = z.object({
  stages: z
    .array(
      z.object({
        id: z.string().max(40).nullable(),
        name: localizedTextSchema(60, true),
        color,
        startDate: isoDate.nullable().optional(),
        endDate: isoDate.nullable().optional(),
        owner: z.string().trim().max(30).nullable().optional(),
      }),
    )
    .min(1)
    .max(20),
});

export const planStatusesSchema = z.object({
  statuses: z
    .array(z.object({ id: z.string().max(40).nullable(), name: localizedTextSchema(40, true), category: z.enum(['todo', 'doing', 'done']), color }))
    .min(3)
    .max(20),
});

export const planItemCreateSchema = z.object({
  kind: z.enum(['phase', 'module', 'feature']),
  parentId: z.string().max(40).nullable(),
  name: localizedTextSchema(160, true),
});

export const planItemUpdateSchema = z
  .object({
    name: localizedTextSchema(160, true).optional(),
    move: z.enum(['up', 'down']).optional(),
    note: z.string().max(2_000).nullable().optional(),
    priority: z.number().int().min(1).max(5).nullable().optional(),
    // Drag and drop: the new parent (null for a phase) and the index among its children.
    parentId: z.string().max(40).nullable().optional(),
    position: z.number().int().min(0).max(1_000).optional(),
  })
  .refine((value) => value.position === undefined || value.parentId !== undefined, { path: ['parentId'], message: 'required' });

export const planTaskSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    status: z.enum(['todo', 'doing', 'done']).optional(),
    statusId: z.string().max(40).nullable().optional(),
    assigneeId: z.number().int().positive().nullable(),
    estimateDays: z.number().min(0).max(999).nullable().optional(),
    progress: z.number().int().min(0).max(100).nullable().optional(),
    link: z.string().trim().max(2_048).nullable().optional(),
    note: z.string().max(2_000).nullable().optional(),
  })
  .refine((task) => task.endDate >= task.startDate, { path: ['endDate'], message: 'before-start' });

export const planScreensSchema = z.object({ screenCodes: z.array(z.string().max(8)).max(50) });

export const planWeekSchema = z.object({
  summary: localizedTextSchema(5_000, false).nullable().optional(),
  hours: z.record(z.string().regex(/^\d{1,12}$/), z.number().min(0).max(168).nullable()).optional(),
});

export const workCalendarSchema = z.object({
  days: z
    .array(z.object({ date: isoDate, kind: z.enum(['holiday', 'workday']), name: z.string().trim().max(80).nullable() }))
    .max(1_000)
    .refine((days) => new Set(days.map((day) => day.date)).size === days.length, { message: 'duplicate' }),
});
