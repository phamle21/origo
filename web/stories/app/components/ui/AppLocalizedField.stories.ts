import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppLocalizedField from '@/components/ui/AppLocalizedField.vue';
import type { LocalizedText } from '~~/shared/contracts/content';

const meta = {
  title: 'UI/AppLocalizedField',
  component: AppLocalizedField,
  args: { modelValue: { vi: 'Giá khóa học', ja: null }, label: 'Point title', isRequired: true },
  render: (args) => ({
    components: { AppLocalizedField },
    setup: () => ({ args, value: ref<LocalizedText>(args.modelValue) }),
    template: '<div class="max-w-xl"><AppLocalizedField v-bind="args" v-model="value" /></div>',
  }),
} satisfies Meta<typeof AppLocalizedField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleLine: Story = {};

export const Multiline: Story = {
  args: {
    modelValue: { vi: 'Hiện giá bán; khi khuyến mãi thì hiện thêm giá gốc gạch ngang.', ja: '販売価格を表示。' },
    label: 'What it does',
    isMultiline: true,
    isRequired: false,
  },
};

export const NarrowContainerStacks: Story = {
  render: (args) => ({
    components: { AppLocalizedField },
    setup: () => ({ args, value: ref<LocalizedText>(args.modelValue) }),
    template: '<div class="max-w-[18rem]"><AppLocalizedField v-bind="args" v-model="value" /></div>',
  }),
};
