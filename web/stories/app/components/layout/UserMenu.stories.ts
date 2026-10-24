import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UserMenu from '@/components/layout/UserMenu.vue';
import type { ThemeMode } from '@/composables/theme/useThemeMode';

const meta = {
  title: 'Layout/UserMenu',
  component: UserMenu,
  args: {
    user: {
      name: 'Minh Anh',
      email: 'ba@origo.local',
      title: 'BA',
      initials: 'MA',
      isAdmin: false,
      permissions: [],
      systemRole: { id: 'r1', key: 'member', name: { vi: 'Thành viên', ja: null } },
    },
    theme: 'system',
    secondaryLanguage: '',
    contentLanguages: [
      { code: 'vi', name: 'Tiếng Việt', isActive: true, isDefault: true },
      { code: 'ja', name: '日本語', isActive: true, isDefault: false },
    ],
    primaryContentLanguage: 'vi',
    languageOptions: [
      { code: 'vi', to: '/' },
      { code: 'ja', to: '/ja' },
      { code: 'en', to: '/en' },
    ],
    currentLanguage: 'vi',
  },
  render: (args) => ({
    components: { UserMenu },
    setup: () => {
      const theme = ref<ThemeMode>(args.theme);
      const secondaryLanguage = ref(args.secondaryLanguage);

      return { args, theme, secondaryLanguage };
    },
    template:
      '<div class="flex min-h-96 justify-end p-4"><UserMenu v-bind="args" v-model:theme="theme" v-model:secondary-language="secondaryLanguage" /></div>',
  }),
} satisfies Meta<typeof UserMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Member: Story = {};

export const Admin: Story = {
  args: {
    user: {
      name: 'Quản trị viên',
      email: 'admin@origo.local',
      title: 'Admin',
      initials: 'QT',
      isAdmin: true,
      permissions: [],
      systemRole: { id: 'r0', key: 'admin', name: { vi: 'Quản trị', ja: '管理者' } },
    },
  },
};
