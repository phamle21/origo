import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScreenPointPanel from '@/components/screen/ScreenPointPanel.vue';
import { CONTENT_LANGUAGE_KEY, type ContentLanguage } from '@/utils/content-language';
import type { PointTab } from '@/utils/point-tabs';
import { linkedPoint, sparsePoint } from './screen-fixtures';

function withContentLanguage(language: ContentLanguage) {
  return () => ({
    setup: () => {
      provide(CONTENT_LANGUAGE_KEY, ref(language));
    },
    template: '<div class="max-w-md"><story /></div>',
  });
}

const meta = {
  title: 'Screen/ScreenPointPanel',
  component: ScreenPointPanel,
  args: { point: linkedPoint, activeTab: 'basic', projectPath: '/p/LMS' },
  render: (args) => ({
    components: { ScreenPointPanel },
    setup: () => ({ args, tab: ref<PointTab>(args.activeTab) }),
    template: '<ScreenPointPanel v-bind="args" :active-tab="tab" @update:active-tab="tab = $event" />',
  }),
  decorators: [withContentLanguage({ primary: 'vi', secondary: null })],
} satisfies Meta<typeof ScreenPointPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicDesign: Story = {};

export const DetailDesign: Story = { args: { activeTab: 'detail' } };

export const Tests: Story = { args: { activeTab: 'tests' } };

export const Impact: Story = { args: { activeTab: 'impact' } };

export const Comments: Story = { args: { activeTab: 'comments' } };

export const JapaneseReader: Story = {
  decorators: [withContentLanguage({ primary: 'ja', secondary: null })],
};

export const Bilingual: Story = {
  decorators: [withContentLanguage({ primary: 'vi', secondary: 'ja' })],
};

export const OnlyBasicDesignWritten: Story = {
  args: { point: sparsePoint, activeTab: 'detail' },
  decorators: [withContentLanguage({ primary: 'ja', secondary: 'vi' })],
};
