import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppButton from '@/components/ui/AppButton.vue';

const meta = {
  title: 'UI/AppButton',
  component: AppButton,
  args: {
    variant: 'primary',
    type: 'button',
    isDisabled: false,
  },
  render: (args) => ({
    components: { AppButton },
    setup: () => ({ args }),
    template: '<AppButton v-bind="args">Add to cart</AppButton>',
  }),
} satisfies Meta<typeof AppButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const LongLabel: Story = {
  render: (args) => ({
    components: { AppButton },
    setup: () => ({ args }),
    template: `
      <div class="max-w-[12rem]">
        <AppButton v-bind="args">Continue to the delivery address step</AppButton>
      </div>
    `,
  }),
};
