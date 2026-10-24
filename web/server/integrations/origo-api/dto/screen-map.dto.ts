import { z } from 'zod';
import { systemPermissionListSchema, systemRoleRefSchema } from './access.dto';
import { localizedTextDtoSchema } from './localized-text.dto';

// Unknown fields are allowed so an API addition never breaks the web app; missing or mistyped ones fail.
export { localizedTextDtoSchema };

const boxDtoSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export const commentDtoSchema = z.object({
  id: z.string(),
  authorInitials: z.string(),
  author: z.string(),
  role: z
    .string()
    .nullish()
    .transform((value) => value ?? ''),
  text: z.string(),
  at: z.string(),
  mentions: z.array(z.object({ id: z.number().int(), name: z.string() })).default([]),
});

const pointDtoSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  title: localizedTextDtoSchema,
  box: boxDtoSchema,
  basic: z.object({ summary: localizedTextDtoSchema, rules: z.array(localizedTextDtoSchema).default([]) }),
  detail: z.object({
    rows: z.array(z.object({ item: localizedTextDtoSchema, spec: localizedTextDtoSchema })).default([]),
    endpoints: z.array(z.string()).default([]),
  }),
  tests: z.array(z.object({ given: localizedTextDtoSchema, when: localizedTextDtoSchema, then: localizedTextDtoSchema })).default([]),
  history: z.array(z.object({ phase: z.string(), note: localizedTextDtoSchema })).default([]),
  concepts: z.array(z.string()).default([]),
  dependsOn: z.array(z.string()).default([]),
  comments: z.array(commentDtoSchema).default([]),
});

export const conceptDtoSchema = z.object({
  key: z.string(),
  name: localizedTextDtoSchema,
  description: localizedTextDtoSchema,
  alsoUsedIn: z.array(localizedTextDtoSchema).default([]),
});

const projectRoleSchema = z
  .string()
  .min(1)
  .max(60)
  .nullish()
  .transform((value) => value ?? null);

const permissionsSchema = z
  .object({
    canEditDesign: z.boolean(),
    canEditPlan: z.boolean(),
    canManageMembers: z.boolean(),
    canEditProject: z.boolean().default(false),
    canArchive: z.boolean().default(false),
    canDelete: z.boolean().default(false),
  })
  .default({ canEditDesign: false, canEditPlan: false, canManageMembers: false, canEditProject: false, canArchive: false, canDelete: false });

const archivedAtSchema = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

export const projectMapDtoSchema = z.object({
  data: z.object({
    code: z.string(),
    name: localizedTextDtoSchema,
    description: localizedTextDtoSchema,
    myRole: projectRoleSchema,
    permissions: permissionsSchema,
    archivedAt: archivedAtSchema,
    concepts: z.array(conceptDtoSchema),
    screens: z.array(
      z.object({
        id: z.string(),
        code: z.string(),
        name: localizedTextDtoSchema,
        flow: localizedTextDtoSchema,
        purpose: localizedTextDtoSchema,
        image: z.object({ src: z.string(), width: z.number().int().positive(), height: z.number().int().positive() }),
        source: z
          .object({
            kind: z.enum(['image', 'html', 'url']),
            url: z
              .string()
              .nullish()
              .transform((value) => value ?? null),
            width: z
              .number()
              .int()
              .positive()
              .nullish()
              .transform((value) => value ?? null),
          })
          .default({ kind: 'image', url: null, width: null }),
        features: z.array(z.object({ id: z.string(), name: localizedTextDtoSchema })).default([]),
        points: z.array(pointDtoSchema),
      }),
    ),
  }),
});

export const projectListDtoSchema = z.object({
  data: z.array(
    z.object({
      code: z.string(),
      name: localizedTextDtoSchema,
      description: localizedTextDtoSchema,
      screenCount: z.number().int().nonnegative().default(0),
      pointCount: z.number().int().nonnegative().default(0),
      myRole: projectRoleSchema,
      permissions: permissionsSchema,
      archivedAt: archivedAtSchema,
      memberCount: z.number().int().nonnegative().default(0),
      managers: z.array(z.object({ id: z.number().int(), name: z.string(), initials: z.string() })).default([]),
    }),
  ),
});

export const userDtoSchema = z.object({
  name: z.string(),
  email: z.string(),
  title: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  initials: z.string(),
  isAdmin: z.boolean(),
  permissions: systemPermissionListSchema,
  systemRole: systemRoleRefSchema.nullish().transform((value) => value ?? null),
});

export const loginDtoSchema = z.object({ token: z.string().min(1), user: userDtoSchema });

export const meDtoSchema = z.object({ data: userDtoSchema });

export const createdScreenDtoSchema = z.object({ data: z.object({ code: z.string() }) });

export const conceptCreatedDtoSchema = z.object({ data: conceptDtoSchema });

export const commentCreatedDtoSchema = z.object({ data: commentDtoSchema });
