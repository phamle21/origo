import { z } from 'zod';
import { localizedTextDtoSchema } from './screen-map.dto';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const projectPlanDtoSchema = z.object({
  data: z.object({
    canEdit: z.boolean(),
    stages: z.array(z.object({ id: z.string(), key: z.string(), name: localizedTextDtoSchema, color: z.string().regex(/^#[0-9a-f]{6}$/i) })),
    items: z.array(
      z.object({
        id: z.string(),
        parentId: z.string().nullable(),
        kind: z.enum(['phase', 'module', 'feature']),
        name: localizedTextDtoSchema,
        note: z
          .string()
          .nullish()
          .transform((value) => value ?? null),
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
        status: z.enum(['todo', 'doing', 'done']),
        assigneeId: z.number().int().nullable(),
      }),
    ),
  }),
});

export const createdItemDtoSchema = z.object({ data: z.object({ id: z.string() }) });
