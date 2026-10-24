import { z } from 'zod';
import { PERMISSION_GROUPS, PROJECT_PERMISSIONS, SYSTEM_PERMISSIONS, type PermissionScope } from '~~/shared/contracts/access';
import { localizedTextSchema } from './screen-editor-schemas';

// Role keys are slugs the API makes from role names.
const projectRoleKeySchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,59}$/);

export const memberCreateSchema = z.object({ userId: z.number().int().positive(), role: projectRoleKeySchema });

export const memberUpdateSchema = z.object({ role: projectRoleKeySchema });

export const accountCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  title: z
    .string()
    .trim()
    .max(40)
    .nullish()
    .transform((value) => value || null),
  systemRoleId: z.string().max(40).nullable().default(null),
});

export const accountUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(255),
    title: z
      .string()
      .trim()
      .max(40)
      .nullable()
      .transform((value) => value || null),
    systemRoleId: z.string().max(40),
    isActive: z.boolean(),
  })
  .partial();

export const projectCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]{1,15}$/),
  name: localizedTextSchema(160, true),
  description: localizedTextSchema(5_000),
  managerId: z.number().int().positive().nullable(),
});

export const projectUpdateSchema = z.object({
  name: localizedTextSchema(160, true),
  description: localizedTextSchema(5_000),
});

export const profileUpdateSchema = z.object({ name: z.string().trim().min(1).max(120) });

// Mirrors the API rule (at least 10 characters, different from the current one) so mistakes show early.
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(255),
    password: z.string().min(10).max(255),
    passwordConfirmation: z.string().max(255),
  })
  .refine((value) => value.password === value.passwordConfirmation, { path: ['passwordConfirmation'], message: 'mismatch' });

export const systemRoleSchema = z.object({
  name: localizedTextSchema(60, true),
  description: localizedTextSchema(300),
  permissions: z.array(z.enum(SYSTEM_PERMISSIONS)).max(SYSTEM_PERMISSIONS.length),
  isDefault: z.boolean().default(false),
});

export const projectRoleSchema = z.object({
  name: localizedTextSchema(60, true),
  description: localizedTextSchema(300),
  permissions: z.array(z.enum(PROJECT_PERMISSIONS)).max(PROJECT_PERMISSIONS.length),
});

export function permissionUpdateSchema(scope: PermissionScope) {
  return z.object({
    name: localizedTextSchema(80, true),
    description: localizedTextSchema(300),
    group: z.enum(PERMISSION_GROUPS[scope]),
    position: z.number().int().min(0).max(999),
  });
}
