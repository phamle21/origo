import { reactive } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppButton from '@/components/ui/AppButton.vue';
import AppFormCard from '@/components/ui/AppFormCard.vue';
import AppFormSection from '@/components/ui/AppFormSection.vue';
import AppTextField from '@/components/ui/AppTextField.vue';
import AppUnsavedBar from '@/components/ui/AppUnsavedBar.vue';

const meta = {
  title: 'UI/AppFormCard',
  component: AppFormCard,
  args: { formId: 'story-form', title: 'Tài khoản mới', description: 'Một khung cho cả form, các phần được đánh số.', tile: 'people' },
  render: (args) => ({
    components: { AppFormCard, AppFormSection, AppTextField, AppButton, AppUnsavedBar },
    setup: () => {
      const draft = reactive({ name: '', email: 'lan@' });

      return { args, draft };
    },
    template: `
      <div class="flex flex-col gap-4 bg-canvas p-4">
        <AppFormCard v-bind="args">
          <AppFormSection :number="1" title="Thông tin người dùng" description="Email dùng để đăng nhập.">
            <AppTextField v-model="draft.name" label="Họ tên" is-required error="Vui lòng nhập ô này." />
            <AppTextField v-model="draft.email" type="email" label="Email" is-required hint="ten@congty.vn" />
          </AppFormSection>
          <AppFormSection :number="2" title="Vai trò hệ thống" description="Quyết định được làm gì ngoài dự án." />
          <template #actions><AppButton variant="secondary">Hủy</AppButton><AppButton type="submit">Tạo</AppButton></template>
        </AppFormCard>
        <AppUnsavedBar :show="true" form="story-form" />
      </div>`,
  }),
} satisfies Meta<typeof AppFormCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithErrorsAndUnsavedBar: Story = {};
