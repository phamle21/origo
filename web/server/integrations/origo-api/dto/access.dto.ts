import { z } from 'zod';
import { localizedTextDtoSchema } from './localized-text.dto';
import { PROJECT_PERMISSIONS, SYSTEM_PERMISSIONS, type ProjectPermission, type SystemPermission } from '~~/shared/contracts/access';

const localizedText = localizedTextDtoSchema;

// Unknown permissions from a newer API are dropped instead of failing the whole response.
export const systemPermissionListSchema = z
  .array(z.string())
  .default([])
  .transform((values) => values.filter((value): value is SystemPermission => (SYSTEM_PERMISSIONS as readonly string[]).includes(value)));

export const systemRoleRefSchema = z.object({ id: z.string(), key: z.string(), name: localizedText });

const systemRoleSchema = systemRoleRefSchema.extend({
  description: localizedText,
  permissions: systemPermissionListSchema,
  isDefault: z.boolean().default(false),
  userCount: z.number().int().nonnegative().default(0),
});

export const systemRoleListDtoSchema = z.object({ data: z.array(systemRoleSchema) });
export const systemRoleDtoSchema = z.object({ data: systemRoleSchema });

const projectPermissionListSchema = z
  .array(z.string())
  .default([])
  .transform((values) => values.filter((value): value is ProjectPermission => (PROJECT_PERMISSIONS as readonly string[]).includes(value)));

const projectRoleSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: localizedText,
  description: localizedText,
  permissions: projectPermissionListSchema,
  memberCount: z.number().int().nonnegative().default(0),
});

export const projectRoleListDtoSchema = z.object({ data: z.array(projectRoleSchema) });
export const projectRoleDtoSchema = z.object({ data: projectRoleSchema });

const permissionEntrySchema = z.object({
  id: z.string(),
  key: z.string(),
  group: z.string(),
  name: localizedText,
  description: localizedText,
  position: z.number().int().nonnegative().default(0),
});

export const permissionListDtoSchema = z.object({ data: z.array(permissionEntrySchema) });
export const permissionDtoSchema = z.object({ data: permissionEntrySchema });
