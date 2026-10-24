// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PermissionChecklist from '@/components/settings/PermissionChecklist.vue';
import type { PermissionEntry } from '~~/shared/contracts/access';

function entry(key: string, group: string, position: number, name: string): PermissionEntry {
  return { id: key, key, group, position, name: { vi: name }, description: { vi: null } };
}

const projectCatalog = [
  entry('project.read', 'reading', 1, 'Xem & góp ý'),
  entry('plan.edit', 'plan', 2, 'Sửa kế hoạch'),
  entry('members.manage', 'team', 4, 'Quản lý thành viên'),
  entry('project.edit', 'team', 3, 'Sửa thông tin dự án'),
];

async function mountList(modelValue: string[], scope: 'system' | 'project' = 'project', catalog = projectCatalog) {
  return mountSuspended(PermissionChecklist, { props: { modelValue, catalog, scope, label: 'Quyền' } });
}

describe('PermissionChecklist', () => {
  test('groups permissions in the scope order and sorts each group by position', async () => {
    const wrapper = await mountList([]);

    expect(wrapper.findAll('p').map((heading) => heading.text())).toEqual(['Xem', 'Kế hoạch', 'Đội dự án']);
    expect(wrapper.findAll('label').map((label) => label.find('span span').text())).toEqual([
      'Xem & góp ý',
      'Sửa kế hoạch',
      'Sửa thông tin dự án',
      'Quản lý thành viên',
    ]);
  });

  test('ticking a change permission in a project also ticks read, and unticking read clears the rest', async () => {
    const wrapper = await mountList([]);
    const boxes = wrapper.findAll('input[type="checkbox"]');

    await boxes[1]?.setValue(true);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['project.read', 'plan.edit']]);

    await wrapper.setProps({ modelValue: ['project.read', 'plan.edit'] });
    await wrapper.findAll('input[type="checkbox"]')[0]?.setValue(false);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]]);
  });

  test('system permissions toggle on their own', async () => {
    const wrapper = await mountList([], 'system', [entry('users.manage', 'people', 1, 'Người dùng'), entry('projects.create', 'projects', 2, 'Tạo dự án')]);

    await wrapper.findAll('input[type="checkbox"]')[1]?.setValue(true);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['projects.create']]);
  });
});
