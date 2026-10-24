import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppLocalizedText from '@/components/ui/AppLocalizedText.vue';
import { CONTENT_LANGUAGE_KEY, type ContentLanguage } from '@/utils/content-language';

function withContentLanguage(language: ContentLanguage) {
  return () => ({
    setup: () => {
      provide(CONTENT_LANGUAGE_KEY, ref(language));
    },
    template: '<div class="max-w-sm"><story /></div>',
  });
}

const meta = {
  title: 'UI/AppLocalizedText',
  component: AppLocalizedText,
  args: { text: { vi: 'Giá hiển thị đã gồm thuế.', ja: '表示価格は税込。' }, as: 'p' },
  decorators: [withContentLanguage({ primary: 'vi', secondary: null })],
} satisfies Meta<typeof AppLocalizedText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vietnamese: Story = {};

export const Japanese: Story = { decorators: [withContentLanguage({ primary: 'ja', secondary: null })] };

export const Bilingual: Story = { decorators: [withContentLanguage({ primary: 'vi', secondary: 'ja' })] };

export const MissingTranslation: Story = {
  args: { text: { vi: 'Hết giờ thì đơn tự hủy và trả lại mã giảm giá.', ja: null } },
  decorators: [withContentLanguage({ primary: 'ja', secondary: 'vi' })],
};
