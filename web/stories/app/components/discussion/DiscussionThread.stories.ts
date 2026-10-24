import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DiscussionThread from '@/components/discussion/DiscussionThread.vue';

const meta = {
  title: 'Discussion/DiscussionThread',
  component: DiscussionThread,
  args: {
    emptyLabel: 'No comments yet.',
    comments: [
      {
        id: 'c-1',
        authorInitials: 'T',
        author: 'Thảo',
        role: 'QA',
        text: '@Minh Anh 30 phút tính từ lúc tạo đơn hay từ lúc vào trang thanh toán?',
        at: '2026-10-21T06:05:00Z',
        mentions: [{ id: 2, name: 'Minh Anh' }],
      },
      {
        id: 'c-2',
        authorInitials: 'MA',
        author: 'Minh Anh',
        role: 'BA',
        text: 'Tính từ lúc tạo đơn. Đã ghi rõ vào quy tắc ở bản v1.3.',
        at: '2026-10-21T07:10:00Z',
        mentions: [],
      },
    ],
  },
  render: (args) => ({
    components: { DiscussionThread },
    setup: () => ({ args }),
    template: '<div class="max-w-sm"><DiscussionThread v-bind="args" /></div>',
  }),
} satisfies Meta<typeof DiscussionThread>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Thread: Story = {};

export const Empty: Story = {
  args: { comments: [] },
};
