import type { Meta, StoryObj } from '@storybook/vue3-vite';
import UserPicker from '@/components/team/UserPicker.vue';
import type { UserOption } from '~~/shared/contracts/member';

const people: UserOption[] = [
  { id: 1, name: 'Minh Anh', email: 'ba@origo.local', title: 'BA', initials: 'MA' },
  { id: 2, name: 'Quang', email: 'dev@origo.local', title: 'Dev', initials: 'Q' },
  { id: 3, name: 'Thảo', email: 'qa@origo.local', title: 'QA', initials: 'T' },
];

const meta = {
  title: 'Team/UserPicker',
  component: UserPicker,
  args: {
    label: 'Person (name or email)',
    search: async (query: string) => people.filter((person) => `${person.name} ${person.email}`.toLowerCase().includes(query.toLowerCase())),
    excludeIds: [1],
  },
} satisfies Meta<typeof UserPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
