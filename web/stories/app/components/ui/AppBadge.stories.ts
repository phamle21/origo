import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppBadge from '@/components/ui/AppBadge.vue';

const meta = {
  title: 'UI/AppBadge',
  component: AppBadge,
  args: { tone: 'neutral', isDashed: false },
  argTypes: {
    tone: { control: 'select', options: ['neutral', 'accent', 'info', 'warning', 'success', 'danger'] },
  },
  render: (args) => ({
    components: { AppBadge },
    setup: () => ({ args }),
    template: '<AppBadge v-bind="args">Approved</AppBadge>',
  }),
} satisfies Meta<typeof AppBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllTones: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <div class="flex flex-wrap gap-2">
        <AppBadge tone="neutral">Draft</AppBadge>
        <AppBadge tone="accent">Built</AppBadge>
        <AppBadge tone="info">Approved</AppBadge>
        <AppBadge tone="warning">In review</AppBadge>
        <AppBadge tone="success">✓ Pass</AppBadge>
        <AppBadge tone="danger">✕ Failed</AppBadge>
        <AppBadge is-dashed>No test</AppBadge>
      </div>
    `,
  }),
};

export const LongLabel: Story = {
  render: (args) => ({
    components: { AppBadge },
    setup: () => ({ args }),
    template: '<div class="max-w-[10rem]"><AppBadge v-bind="args">Changed in v1.3 · CR-007 · clarified hold time</AppBadge></div>',
  }),
};
