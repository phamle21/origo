import { describe, expect, test } from 'vitest';
import { planTaskSchema } from '~~/server/utils/plan-schemas';
import {
  accountCreateSchema,
  permissionUpdateSchema,
  projectRoleSchema,
  systemRoleSchema,
  memberCreateSchema,
  passwordChangeSchema,
  profileUpdateSchema,
  projectCreateSchema,
} from '~~/server/utils/team-schemas';

describe('team and plan request schemas', () => {
  test('normalises a new account', () => {
    expect(accountCreateSchema.parse({ name: ' Lan ', email: ' Lan@Origo.Local ', title: '' })).toEqual({
      name: 'Lan',
      email: 'lan@origo.local',
      title: null,
      systemRoleId: null,
    });
  });

  test('accepts any well-formed project role key (roles are created by admins)', () => {
    expect(memberCreateSchema.safeParse({ userId: 3, role: 'qa' }).success).toBe(true);
    expect(memberCreateSchema.safeParse({ userId: 3, role: 'tech-lead-2' }).success).toBe(true);
    expect(memberCreateSchema.safeParse({ userId: 3, role: 'Tech Lead' }).success).toBe(false);
  });

  test('upper-cases the project code and rejects one that starts with a digit', () => {
    const project = { name: { vi: 'Bán hàng', ja: null }, description: { vi: null, ja: null }, managerId: null };

    expect(projectCreateSchema.parse({ ...project, code: 'crm2' }).code).toBe('CRM2');
    expect(projectCreateSchema.safeParse({ ...project, code: '2CRM' }).success).toBe(false);
  });

  test('rejects a task that ends before it starts', () => {
    const task = { startDate: '2026-10-10', endDate: '2026-10-09', status: 'todo', assigneeId: null };

    expect(planTaskSchema.safeParse(task).success).toBe(false);
    expect(planTaskSchema.safeParse({ ...task, endDate: '2026-10-10' }).success).toBe(true);
  });

  test('checks a password change before it reaches the API', () => {
    const change = { currentPassword: 'old', password: 'long-enough-1', passwordConfirmation: 'long-enough-1' };

    expect(passwordChangeSchema.safeParse(change).success).toBe(true);
    expect(passwordChangeSchema.safeParse({ ...change, passwordConfirmation: 'other-value-1' }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ ...change, password: 'short', passwordConfirmation: 'short' }).success).toBe(false);
    expect(profileUpdateSchema.parse({ name: '  Lan ' })).toEqual({ name: 'Lan' });
  });

  test('accepts only known system permissions and project roles', () => {
    const role = { name: { vi: 'PMO', ja: null }, description: { vi: null, ja: null } };

    expect(systemRoleSchema.safeParse({ ...role, permissions: ['projects.view_all'] }).success).toBe(true);
    expect(systemRoleSchema.safeParse({ ...role, permissions: ['root'] }).success).toBe(false);
    expect(projectRoleSchema.safeParse({ ...role, permissions: ['plan.edit'] }).success).toBe(true);
    expect(projectRoleSchema.safeParse({ ...role, permissions: ['projects.view_all'] }).success).toBe(false);
    expect(permissionUpdateSchema('project').safeParse({ name: { vi: 'Xem' }, description: { vi: null }, group: 'reading', position: 1 }).success).toBe(true);
    expect(permissionUpdateSchema('project').safeParse({ name: { vi: 'Xem' }, description: { vi: null }, group: 'people', position: 1 }).success).toBe(false);
  });
});
