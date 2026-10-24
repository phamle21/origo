import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';

const meta = {
  title: 'UI/AppCheckbox',
  component: AppCheckbox,
  args: { modelValue: true, isDisabled: false, size: 'lg' },
  render: (args) => ({
    components: { AppCheckbox },
    setup: () => {
      const isChecked = ref(args.modelValue);

      return { args, isChecked };
    },
    template: '<label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><AppCheckbox v-bind="args" v-model="isChecked" /> Sửa kế hoạch</label>',
  }),
} satisfies Meta<typeof AppCheckbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Checked: Story = {};

export const Unchecked: Story = { args: { modelValue: false } };

export const Disabled: Story = { args: { isDisabled: true } };
