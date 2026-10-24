import { computed, ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import PlanGantt from '@/components/plan/PlanGantt.vue';
import { toDayNumber, toIsoDate, type DayRange } from '@/utils/plan-dates';
import { buildPlanRows } from '@/utils/plan-tree';
import type { PlanItem, PlanStage, PlanTask } from '~~/shared/contracts/plan';

const stages: PlanStage[] = [
  { id: 'bd', key: 'basic-design', name: { vi: 'Thiết kế cơ bản', ja: '基本設計' }, color: '#7c3aed' },
  { id: 'dev', key: 'development', name: { vi: 'Phát triển', ja: '開発' }, color: '#0f766e' },
  { id: 'dd', key: 'deploy-dev', name: { vi: 'Deploy DEV', ja: 'DEV環境リリース' }, color: '#ca8a04' },
  { id: 'uat', key: 'uat', name: { vi: 'UAT', ja: '受入テスト' }, color: '#ea580c' },
];

const items: PlanItem[] = [
  { id: 'p1', parentId: null, kind: 'phase', name: { vi: 'Phase 1 — Ra mắt', ja: 'フェーズ1' }, position: 0, note: null, screenCodes: [] },
  { id: 'm1', parentId: 'p1', kind: 'module', name: { vi: 'Khóa học', ja: 'コース' }, position: 0, note: null, screenCodes: [] },
  {
    id: 'f1',
    parentId: 'm1',
    kind: 'feature',
    name: { vi: 'Danh sách khóa học', ja: 'コース一覧' },
    position: 0,
    note: 'Chờ khách xác nhận bộ lọc theo giá.',
    screenCodes: ['SC-01'],
  },
  {
    id: 'f2',
    parentId: 'm1',
    kind: 'feature',
    name: { vi: 'Giỏ hàng và thanh toán có tên rất dài để thử xuống dòng', ja: null },
    position: 1,
    note: null,
    screenCodes: [],
  },
  { id: 'f3', parentId: 'm1', kind: 'feature', name: { vi: 'Chưa lên lịch', ja: null }, position: 2, note: null, screenCodes: [] },
];

const initialTasks: PlanTask[] = [
  { id: 't1', itemId: 'f1', stageId: 'bd', startDate: '2026-10-05', endDate: '2026-10-09', status: 'done', assigneeId: null },
  { id: 't2', itemId: 'f1', stageId: 'dev', startDate: '2026-10-12', endDate: '2026-10-23', status: 'doing', assigneeId: null },
  { id: 't3', itemId: 'f2', stageId: 'bd', startDate: '2026-10-08', endDate: '2026-10-14', status: 'doing', assigneeId: null },
  { id: 't4', itemId: 'f2', stageId: 'dev', startDate: '2026-10-13', endDate: '2026-10-28', status: 'todo', assigneeId: null },
  { id: 't5', itemId: 'f2', stageId: 'dd', startDate: '2026-10-29', endDate: '2026-10-30', status: 'todo', assigneeId: null },
  { id: 't6', itemId: 'f2', stageId: 'uat', startDate: '2026-11-02', endDate: '2026-11-06', status: 'todo', assigneeId: null },
];

const meta = {
  title: 'Plan/PlanGantt',
  component: PlanGantt,
  args: {
    rows: [],
    stages,
    timeline: { start: toDayNumber('2026-10-01'), end: toDayNumber('2026-11-15') },
    dayWidth: 26,
    today: toDayNumber('2026-10-22'),
    canEdit: true,
    selectedItemId: null,
    language: 'vi',
  },
  render: (args) => ({
    components: { PlanGantt },
    setup: () => {
      const tasks = ref(initialTasks.map((task) => ({ ...task })));
      const collapsed = ref(new Set<string>());
      const selected = ref<string | null>(null);
      const rows = computed(() => buildPlanRows(items, tasks.value, collapsed.value));

      function handleMove(task: PlanTask, range: DayRange) {
        tasks.value = tasks.value.map((own) => (own.id === task.id ? { ...own, startDate: toIsoDate(range.start), endDate: toIsoDate(range.end) } : own));
      }

      function handleToggle(id: string) {
        const next = new Set(collapsed.value);

        if (!next.delete(id)) {
          next.add(id);
        }
        collapsed.value = next;
      }

      return { args, rows, selected, handleMove, handleToggle };
    },
    template:
      '<PlanGantt v-bind="args" :rows="rows" :selected-item-id="selected" @move-task="handleMove" @toggle="handleToggle" @select="selected = $event" />',
  }),
} satisfies Meta<typeof PlanGantt>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Editable: Story = {};

export const ReadOnly: Story = { args: { canEdit: false } };

export const NarrowZoom: Story = { args: { dayWidth: 14 } };
