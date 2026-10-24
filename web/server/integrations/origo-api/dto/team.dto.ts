import { z } from 'zod';
import { systemPermissionListSchema, systemRoleRefSchema } from './access.dto';
import { localizedTextDtoSchema } from './screen-map.dto';

const userOptionSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  title: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  initials: z.string(),
});

export const adminUserSchema = userOptionSchema.extend({
  isAdmin: z.boolean(),
  isActive: z.boolean(),
  projectCount: z.number().int().nonnegative().default(0),
  permissions: systemPermissionListSchema,
  systemRole: systemRoleRefSchema.nullish().transform((value) => value ?? null),
});

export const userMembershipListDtoSchema = z.object({
  data: z.array(z.object({ memberId: z.string(), role: z.string().min(1).max(60), project: z.object({ code: z.string(), name: localizedTextDtoSchema }) })),
});

export const memberSchema = z.object({
  id: z.string(),
  role: z.string().min(1).max(60),
  user: userOptionSchema.extend({ isActive: z.boolean() }),
});

export const memberListDtoSchema = z.object({ data: z.array(memberSchema) });
export const memberDtoSchema = z.object({ data: memberSchema });
export const userLookupDtoSchema = z.object({ data: z.array(userOptionSchema) });
export const adminUserListDtoSchema = z.object({ data: z.array(adminUserSchema) });
export const adminUserDtoSchema = z.object({ data: adminUserSchema });
export const createdAccountDtoSchema = z.object({ data: adminUserSchema, temporaryPassword: z.string().min(1) });
export const resetPasswordDtoSchema = z.object({ temporaryPassword: z.string().min(1) });
