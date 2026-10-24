// @vitest-environment nuxt
import { beforeAll, describe, expect, test } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import TeamAddDialog from '@/components/team/TeamAddDialog.vue';
import TeamRoleSummary from '@/components/team/TeamRoleSummary.vue';
import UserPicker from '@/components/team/UserPicker.vue';
import type { ProjectRoleOption } from '~~/shared/contracts/access';

const roles: ProjectRoleOption[] = [
  { id: '1', key: 'manager', name: { vi: 'Quản lý dự án' }, description: { vi: 'Mọi quyền' }, permissions: ['project.read', 'members.manage'], memberCount: 1 },
  { id: '2', key: 'dev', name: { vi: 'Lập trình viên' }, description: { vi: 'Chỉ xem' }, permissions: ['project.read'], memberCount: 2 },
];
const person = { id: 7, name: 'Lan', email: 'lan@origo.local', title: null, initials: 'L' };

describe('TeamAddDialog', () => {
  beforeAll(() => {
    // happy-dom has no modal dialog support.
    HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  test('starts on the read-only role and adds the picked person with the chosen role', async () => {
    const wrapper = await mountSuspended(TeamAddDialog, {
      props: { open: true, roles, search: () => Promise.resolve([person]), excludeIds: [], isSaving: false, error: '' },
      attachTo: document.body,
    });
    await flushPromises();

    expect(wrapper.get<HTMLInputElement>('input[value="dev"]').element.checked).toBe(true);
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();

    wrapper.getComponent(UserPicker).vm.$emit('pick', person);
    await flushPromises();
    await wrapper.get('input[value="manager"]').setValue(true);
    await wrapper.get('form').trigger('submit');

    expect(wrapper.emitted('add')).toEqual([[7, 'manager']]);
    wrapper.unmount();
  });
});

describe('TeamRoleSummary', () => {
  test('shows how many hold each role and filters on a click', async () => {
    const wrapper = await mountSuspended(TeamRoleSummary, {
      props: {
        roles,
        permissions: [{ id: 'p', key: 'members.manage', group: 'team', position: 1, name: { vi: 'Quản lý thành viên' }, description: { vi: null } }],
        counts: { dev: 2 },
        activeRole: 'dev',
        canEditRoles: false,
      },
    });
    const [manager, dev] = wrapper.findAll('ul button');

    expect(manager?.text()).toContain('Chưa có ai');
    expect(dev?.text()).toContain('2 người');
    expect(dev?.attributes('aria-pressed')).toBe('true');

    await manager?.trigger('click');
    await dev?.trigger('click');
    expect(wrapper.emitted('filter')).toEqual([['manager'], [null]]);
  });
});
