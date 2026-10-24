import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';

const meta = {
  title: 'UI/AppEmptyState',
  component: AppEmptyState,
  args: {
    title: 'No acceptance criteria yet',
    description: 'The analyst writes criteria as Given / When / Then so developers know when they are done and QA can derive test cases.',
  },
} satisfies Meta<typeof AppEmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithDescription: Story = {};

export const TitleOnly: Story = {
  args: { description: undefined },
};
