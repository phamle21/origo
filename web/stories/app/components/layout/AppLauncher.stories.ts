import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppLauncher from '@/components/layout/AppLauncher.vue';

const meta = {
  title: 'Layout/AppLauncher',
  component: AppLauncher,
  args: {
    current: 'projects',
    apps: [
      { id: 'projects', label: 'Projects', tile: 'projects', to: '/' },
      { id: 'settings', label: 'Settings', tile: 'settings', to: '/settings' },
    ],
  },
  decorators: [() => ({ template: '<div class="min-h-72 p-4"><story /></div>' })],
} satisfies Meta<typeof AppLauncher>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Admin: Story = {};

export const Member: Story = { args: { apps: [{ id: 'projects', label: 'Projects', tile: 'projects', to: '/' }] } };
