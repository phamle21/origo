import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppTileIcon from '@/components/ui/AppTileIcon.vue';

const meta = {
  title: 'UI/AppTileIcon',
  component: AppTileIcon,
  args: { name: 'plan', size: 'md' },
} satisfies Meta<typeof AppTileIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const Launcher: Story = {
  render: () => ({
    components: { AppTileIcon },
    template:
      "<div class=\"inline-grid grid-cols-3 gap-3 rounded-card bg-tile p-4\"><AppTileIcon v-for=\"name in ['plan', 'design', 'members', 'people', 'projects', 'admin']\" :key=\"name\" :name=\"name\" size=\"lg\" /></div>",
  }),
};
