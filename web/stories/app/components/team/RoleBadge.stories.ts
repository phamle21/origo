import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RoleBadge from '@/components/team/RoleBadge.vue';

const meta = {
  title: 'Team/RoleBadge',
  component: RoleBadge,
  args: { role: 'manager' },
} satisfies Meta<typeof RoleBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllRoles: Story = {
  render: () => ({
    components: { RoleBadge },
    template:
      "<div class=\"flex flex-wrap gap-2\"><RoleBadge v-for=\"role in ['manager', 'ba', 'dev', 'qa', 'customer']\" :key=\"role\" :role=\"role\" /></div>",
  }),
};
