// @vitest-environment nuxt
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import ExcelTemplatePage from '@/pages/settings/excel-template.vue';
import type { PlanExcelTemplate } from '~~/shared/contracts/plan';

const { fetchMock, uploadMock, deleteMock, confirmMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  uploadMock: vi.fn(),
  deleteMock: vi.fn(),
  confirmMock: vi.fn(),
}));

vi.mock('@/api/settings/settings', () => ({
  fetchPlanTemplate: fetchMock,
  uploadPlanTemplate: uploadMock,
  deletePlanTemplate: deleteMock,
  PLAN_TEMPLATE_FILE_URL: '/api/settings/plan-template/file',
}));
mockNuxtImport('useSystemAccess', () => () => ({ canManageSettings: ref(true), canManageUsers: ref(true) }));
mockNuxtImport('useConfirm', () => () => confirmMock);

const stored: PlanExcelTemplate = {
  originalName: 'team.xlsx',
  uploadedAt: '2026-10-25T09:00:00Z',
  uploadedBy: { id: 1, name: 'Quản trị viên' },
  ganttSheet: 'Phase1 Gantt Chart',
  candidates: ['Phase1 Gantt Chart', 'Copy of Phase1 Gantt Chart'],
  weeklySheet: 'Weekly Report',
  warnings: [],
};

async function mountPage(template: PlanExcelTemplate | null) {
  fetchMock.mockResolvedValue(template);
  clearNuxtData('plan-template');

  return mountSuspended(ExcelTemplatePage);
}

async function pick(wrapper: Awaited<ReturnType<typeof mountPage>>, file: File) {
  const input = wrapper.get('input[type="file"]');
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
}

describe('Excel template settings page', () => {
  beforeEach(() => vi.clearAllMocks());

  test('says exports use Origo’s own layout until a template is uploaded, then uploads the chosen workbook', async () => {
    uploadMock.mockResolvedValue(stored);
    const wrapper = await mountPage(null);

    expect(wrapper.text()).toContain('Chưa có mẫu');
    await pick(wrapper, new File(['x'], 'team.xlsx'));
    await wrapper.get('form').trigger('submit');
    await new Promise((resolve) => setTimeout(resolve));

    expect(uploadMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'team.xlsx' }), null);
  });

  test('refuses a file that is not .xlsx before sending it', async () => {
    const wrapper = await mountPage(null);

    await pick(wrapper, new File(['x'], 'plan.xls'));

    expect(wrapper.text()).toContain('Hãy chọn file .xlsx.');
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  test('shows the template in use and removes it only after confirming', async () => {
    deleteMock.mockResolvedValue({ ok: true });
    confirmMock.mockResolvedValue(true);
    const wrapper = await mountPage(stored);

    expect(wrapper.text()).toContain('team.xlsx');
    expect(wrapper.text()).toContain('Sheet Gantt: Phase1 Gantt Chart');
    expect(wrapper.text()).toContain('Sheet Gantt dùng để điền');

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Bỏ mẫu'))
      ?.trigger('click');
    await new Promise((resolve) => setTimeout(resolve));

    expect(confirmMock).toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalled();
  });
});
