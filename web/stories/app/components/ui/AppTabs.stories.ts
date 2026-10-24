import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppTabs from '@/components/ui/AppTabs.vue';

const meta = {
  title: 'UI/AppTabs',
  component: AppTabs,
  args: {
    tabs: [
      { id: 'basic', label: 'Basic' },
      { id: 'detail', label: 'Detail' },
      { id: 'tests', label: 'Tests', count: 2 },
      { id: 'impact', label: 'Impact', count: 3 },
      { id: 'comments', label: 'Comments', count: 0 },
    ],
    modelValue: 'basic',
    label: 'Point details',
    idPrefix: 'story',
  },
  render: (args) => ({
    components: { AppTabs },
    setup: () => ({ args, active: ref<string>(args.modelValue) }),
    template: '<AppTabs v-bind="args" v-model="active" />',
  }),
} satisfies Meta<typeof AppTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};

export const NarrowWraps: Story = {
  render: (args) => ({
    components: { AppTabs },
    setup: () => ({ args, active: ref<string>(args.modelValue) }),
    template: '<div class="max-w-[16rem]"><AppTabs v-bind="args" v-model="active" /></div>',
  }),
};
