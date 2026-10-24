import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppIcon from '@/components/ui/AppIcon.vue';

const NAMES = [
  'folder',
  'shield',
  'users',
  'user',
  'plan',
  'design',
  'calendar',
  'image',
  'plus',
  'search',
  'key',
  'lock',
  'unlock',
  'pencil',
  'arrowRight',
  'chevronRight',
  'grip',
  'move',
  'info',
  'trash',
  'check',
];

const meta = {
  title: 'UI/AppIcon',
  component: AppIcon,
  args: { name: 'folder' },
} satisfies Meta<typeof AppIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  render: () => ({
    components: { AppIcon },
    setup: () => ({ names: NAMES }),
    template:
      '<ul class="grid grid-cols-6 gap-4 text-xs"><li v-for="name in names" :key="name" class="flex flex-col items-center gap-1"><AppIcon :name="name" :size="24" />{{ name }}</li></ul>',
  }),
};
