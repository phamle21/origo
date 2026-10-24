import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EditorBoxCanvas from '@/components/editor/EditorBoxCanvas.vue';
import type { Box } from '@/utils/box-geometry';

const meta = {
  title: 'Editor/EditorBoxCanvas',
  component: EditorBoxCanvas,
  args: {
    image: { src: '/images/screens/cart.svg', width: 1_200, height: 760 },
    imageAlt: 'Cart screen',
    boxes: [
      { key: 'a', number: 1, title: 'Cart line', box: [3.5, 16, 58, 26] },
      { key: 'b', number: 2, title: 'Coupon', box: [65, 16, 31.5, 20] },
    ],
    selectedKey: 'b',
  },
  render: (args) => ({
    components: { EditorBoxCanvas },
    setup: () => {
      const boxes = ref(args.boxes.map((item) => ({ ...item })));
      const selected = ref<string | null>(args.selectedKey);

      function handleCreate(box: Box) {
        const key = `new-${boxes.value.length + 1}`;
        boxes.value = [...boxes.value, { key, number: boxes.value.length + 1, title: '', box }];
        selected.value = key;
      }

      function handleChange(key: string, box: Box) {
        boxes.value = boxes.value.map((item) => (item.key === key ? { ...item, box } : item));
      }

      return { args, boxes, selected, handleCreate, handleChange };
    },
    template:
      '<EditorBoxCanvas v-bind="args" :boxes="boxes" :selected-key="selected" @create="handleCreate" @change="handleChange" @select="selected = $event" @remove="boxes = boxes.filter((item) => item.key !== $event)" />',
  }),
} satisfies Meta<typeof EditorBoxCanvas>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
