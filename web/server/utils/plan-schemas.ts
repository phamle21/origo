import { z } from 'zod';
import { localizedTextSchema } from './screen-editor-schemas';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const planStagesSchema = z.object({
  stages: z
    .array(z.object({ id: z.string().max(40).nullable(), name: localizedTextSchema(60, true), color: z.string().regex(/^#[0-9a-f]{6}$/i) }))
    .min(1)
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
    // Drag and drop: the new parent (null for a phase) and the index among its children.
    parentId: z.string().max(40).nullable().optional(),
    position: z.number().int().min(0).max(1_000).optional(),
  })
  .refine((value) => value.position === undefined || value.parentId !== undefined, { path: ['parentId'], message: 'required' });

export const planTaskSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    status: z.enum(['todo', 'doing', 'done']),
    assigneeId: z.number().int().positive().nullable(),
  })
  .refine((task) => task.endDate >= task.startDate, { path: ['endDate'], message: 'before-start' });

export const planScreensSchema = z.object({ screenCodes: z.array(z.string().max(8)).max(50) });
