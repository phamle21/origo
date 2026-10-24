import type { ScreenDetail, ScreenPoint } from '~~/shared/contracts/screen';

/** A point with every tab filled in, links in both directions, and one missing Japanese translation. */
export const linkedPoint: ScreenPoint = {
  id: 'point-2',
  number: 2,
  title: { vi: 'Ô nhập mã giảm giá', ja: 'クーポン入力欄' },
  box: [65, 16, 31.5, 20],
  basic: {
    summary: { vi: 'Học viên nhập mã và bấm “Áp dụng”.', ja: '受講者がコードを入力し「適用」を押す。' },
    rules: [
      { vi: 'Mỗi mã chỉ dùng một lần cho mỗi tài khoản.', ja: '1つのコードは1アカウントにつき1回まで。' },
      { vi: 'Mã hết hạn thì báo lỗi ngay dưới ô nhập.', ja: null },
    ],
  },
  detail: {
    rows: [{ item: { vi: 'Định dạng mã', ja: 'コード形式' }, spec: { vi: 'Chữ in hoa và số, 4–20 ký tự.', ja: '英大文字と数字、4〜20文字。' } }],
    endpoints: ['POST /api/v1/cart/coupon'],
  },
  tests: [
    {
      given: { vi: 'Mã còn hạn, chưa dùng', ja: '有効期限内・未使用のコード' },
      when: { vi: 'Bấm “Áp dụng”', ja: '「適用」を押す' },
      then: { vi: 'Hiện “Đã áp dụng” và số tiền giảm', ja: '「適用済み」と割引額を表示' },
    },
  ],
  concepts: [
    {
      key: 'coupon',
      name: { vi: 'Mã giảm giá', ja: 'クーポン' },
      description: { vi: 'Mỗi tài khoản dùng một lần.', ja: '1アカウント1回まで。' },
      alsoUsedIn: [{ vi: 'Báo cáo khuyến mãi', ja: 'キャンペーンレポート' }],
    },
  ],
  dependsOn: [],
  affects: [
    {
      pointId: 'point-3',
      screenCode: 'SC-02',
      screenName: { vi: 'Giỏ hàng', ja: 'カート' },
      number: 3,
      title: { vi: 'Tạm tính và tổng tiền', ja: '小計と合計' },
      reason: 'dependedOnBy',
      conceptName: null,
    },
    {
      pointId: 'point-7',
      screenCode: 'SC-03',
      screenName: { vi: 'Thanh toán', ja: '決済' },
      number: 3,
      title: { vi: 'Đồng hồ giữ đơn', ja: '注文保持タイマー' },
      reason: 'sharedConcept',
      conceptName: { vi: 'Mã giảm giá', ja: 'クーポン' },
    },
  ],
  history: [{ phase: 'Phase 2', note: { vi: 'Thêm kiểm tra mã hết hạn.', ja: '期限切れチェックを追加。' } }],
  comments: [{ id: 'c-1', authorInitials: 'Y', author: 'Yamada', role: 'PO', text: '大文字小文字は区別しますか？', at: '2026-10-20T03:00:00Z', mentions: [] }],
};

/** A point with only a basic design written, as most points start. */
export const sparsePoint: ScreenPoint = {
  id: 'point-4',
  number: 4,
  title: { vi: 'Nút “Thanh toán”', ja: null },
  box: [65, 70, 31.5, 11],
  basic: { summary: { vi: 'Tạo đơn hàng và chuyển sang trang thanh toán.', ja: null }, rules: [] },
  detail: { rows: [], endpoints: [] },
  tests: [],
  concepts: [],
  dependsOn: [],
  affects: [],
  history: [],
  comments: [],
};

export const cartScreen: Pick<ScreenDetail, 'image' | 'points'> = {
  image: { src: '/images/screens/cart.svg', width: 1_200, height: 760 },
  points: [
    { ...sparsePoint, id: 'point-1', number: 1, title: { vi: 'Dòng khóa học trong giỏ', ja: 'カート内のコース行' }, box: [3.5, 16, 58, 26] },
    linkedPoint,
    { ...sparsePoint, id: 'point-3', number: 3, title: { vi: 'Tạm tính và tổng tiền', ja: '小計と合計' }, box: [65, 40, 31.5, 26] },
    sparsePoint,
  ],
};
