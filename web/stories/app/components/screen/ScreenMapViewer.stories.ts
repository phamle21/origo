import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScreenMapViewer from '@/components/screen/ScreenMapViewer.vue';
import ScreenPointList from '@/components/screen/ScreenPointList.vue';
import { cartScreen } from './screen-fixtures';

const meta = {
  title: 'Screen/ScreenMapViewer',
  component: ScreenMapViewer,
  args: {
    image: cartScreen.image,
    imageAlt: 'Cart screen with numbered points',
    points: cartScreen.points,
    selectedNumber: 2,
    caption: 'Click a number on the screen or in the list to see its details.',
  },
} satisfies Meta<typeof ScreenMapViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Selected: Story = {};

export const WithPointList: Story = {
  render: (args) => ({
    components: { ScreenMapViewer, ScreenPointList },
    setup: () => ({ args, selected: ref<number | null>(args.selectedNumber) }),
    template: `
      <div class="flex flex-col gap-4">
        <ScreenMapViewer v-bind="args" :selected-number="selected" @select="selected = $event" />
        <ScreenPointList :points="args.points" :selected-number="selected" label="Numbered points" @select="selected = $event" />
      </div>
    `,
  }),
};

export const Mobile: Story = {
  globals: { viewport: { value: 'iPhone16' } },
};
