// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import UserMenu from '@/components/layout/UserMenu.vue';
import { chooseOption, openSelect, optionLabels } from '../../../helpers/app-select';

const props = {
  user: {
    name: 'Minh Anh',
    email: 'ba@origo.local',
    title: 'BA',
    initials: 'MA',
    isAdmin: false,
    permissions: [],
    systemRole: { id: 'r1', key: 'member', name: { vi: 'Thành viên', ja: null } },
  },
  theme: 'system' as const,
  secondaryLanguage: '',
  contentLanguages: [
    { code: 'vi', name: 'Tiếng Việt', isActive: true, isDefault: true },
    { code: 'ja', name: '日本語', isActive: true, isDefault: false },
  ],
  primaryContentLanguage: 'vi',
  languageOptions: [
    { code: 'vi' as const, to: '/' },
    { code: 'ja' as const, to: '/ja' },
  ],
  currentLanguage: 'vi',
};

describe('UserMenu', () => {
  test('keeps theme, language, profile and sign-out behind the avatar', async () => {
    const wrapper = await mountSuspended(UserMenu, { props });

    expect(wrapper.get('[aria-haspopup]').text()).toContain('Minh Anh');
    expect(wrapper.get('[aria-haspopup]').text()).not.toContain('Thành viên');
    await wrapper.get('[aria-haspopup]').trigger('click');

    const themeButtons = wrapper.findAll('[role="group"] button');

    expect(themeButtons.map((button) => button.attributes('aria-pressed'))).toEqual(['false', 'false', 'true']);
    await themeButtons[1]?.trigger('click');
    expect(wrapper.emitted('update:theme')).toEqual([['dark']]);

    await openSelect(wrapper);
    expect(optionLabels(wrapper)).toEqual([expect.any(String), '日本語']);
    await chooseOption(wrapper, '日本語');
    expect(wrapper.emitted('update:secondaryLanguage')).toEqual([['ja']]);

    expect(wrapper.find('a[href$="/profile"]').exists()).toBe(true);
    await wrapper.findAll('button').at(-1)?.trigger('click');
    expect(wrapper.emitted('signOut')).toHaveLength(1);
  });

  test('shows a system role other than plain member next to the job title', async () => {
    const pmo = { ...props.user, systemRole: { id: 'r2', key: 'pmo', name: { vi: 'PMO', ja: null } } };
    const wrapper = await mountSuspended(UserMenu, { props: { ...props, user: pmo } });

    expect(wrapper.get('[aria-haspopup]').text()).toContain('BA · PMO');
  });
});
