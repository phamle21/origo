import type { LocalizedText } from '~~/shared/contracts/content';
import type { BusinessConcept, PointTestCase } from '~~/shared/contracts/screen';

import type { ProjectRecord, ScreenPointRecord, ScreenRecord } from '~~/server/repositories/project/records';

/**
 * A sample screen map used as the fixture for service tests. A few Japanese texts are deliberately null
 * to cover the "not translated yet" state.
 */
function text(vi: string, ja: string | null): LocalizedText {
  return { vi, ja };
}

function test(given: LocalizedText, when: LocalizedText, then: LocalizedText): PointTestCase {
  return { given, when, then };
}

type PointSeed = Pick<ScreenPointRecord, 'number' | 'title' | 'box' | 'basic'> & Partial<ScreenPointRecord>;

type ScreenSeed = Omit<ScreenRecord, 'id' | 'source' | 'features'>;

function point(seed: PointSeed): ScreenPointRecord {
  return { id: '', detail: { rows: [], endpoints: [] }, tests: [], concepts: [], dependsOn: [], history: [], comments: [], ...seed };
}

const PURCHASE_FLOW = text('Mua khóa học', 'コース購入');

const LEARNING_CONCEPTS: BusinessConcept[] = [
  {
    key: 'course-price',
    name: text('Giá khóa học', 'コース価格'),
    description: text('Giá bán đã gồm thuế; có giá giảm khi khóa học đang khuyến mãi.', '税込の販売価格。キャンペーン中は割引価格がある。'),
    alsoUsedIn: [
      text('Đơn hàng: lưu giá tại thời điểm mua', '注文：購入時点の価格を保存'),
      text('Hóa đơn điện tử', '電子請求書'),
      text('Báo cáo doanh thu', '売上レポート'),
      text('Hoàn tiền', '返金'),
    ],
  },
  {
    key: 'coupon',
    name: text('Mã giảm giá', 'クーポン'),
    description: text('Mã giảm theo % hoặc số tiền, mỗi tài khoản dùng một lần.', '割合または金額で割引するコード。1アカウント1回まで。'),
    alsoUsedIn: [text('Báo cáo khuyến mãi', 'キャンペーンレポート')],
  },
  {
    key: 'order-total',
    name: text('Tổng tiền đơn hàng', '注文合計'),
    description: text('Giá khóa học trừ giảm giá; là số tiền thực trả.', 'コース価格から割引を引いた実際の支払額。'),
    alsoUsedIn: [text('Email biên nhận', '領収メール'), text('Hóa đơn điện tử', '電子請求書')],
  },
  {
    key: 'order-hold',
    name: text('Thời gian giữ đơn', '注文保持時間'),
    description: text('Đơn chưa thanh toán được giữ 30 phút kể từ lúc tạo.', '未払いの注文は作成から30分間保持される。'),
    alsoUsedIn: [text('Tác vụ tự hủy đơn chạy nền', '自動キャンセルのバックグラウンド処理')],
  },
  {
    key: 'payment-method',
    name: text('Phương thức thanh toán', '支払方法'),
    description: text('Thẻ và ví điện tử; trả góp đang chờ duyệt.', 'カードと電子ウォレット。分割払いは承認待ち。'),
    alsoUsedIn: [text('Cấu hình cổng thanh toán', '決済ゲートウェイ設定')],
  },
];

const COURSE_DETAIL: ScreenSeed = {
  code: 'SC-01',
  name: text('Chi tiết khóa học', 'コース詳細'),
  flow: PURCHASE_FLOW,
  purpose: text(
    'Học viên xem thông tin, giá và nội dung khóa học, rồi thêm khóa học vào giỏ.',
    '受講者がコースの情報・価格・内容を確認し、カートに追加する画面。',
  ),
  image: { src: '/images/screens/course-detail.svg', width: 1200, height: 760 },
  points: [
    point({
      number: 1,
      title: text('Tên và ảnh khóa học', 'コース名と画像'),
      box: [3.5, 12, 54, 44],
      basic: {
        summary: text('Hiển thị tên, ảnh bìa, mô tả ngắn và đánh giá của khóa học.', 'コース名・カバー画像・概要・評価を表示する。'),
        rules: [text('Khóa học đang ẩn thì không mở được trang này.', '非公開のコースはこの画面を開けない。')],
      },
      detail: {
        rows: [
          { item: text('Tên khóa học', 'コース名'), spec: text('Tối đa 120 ký tự, xuống dòng nếu dài.', '最大120文字。長い場合は折り返す。') },
          { item: text('Ảnh bìa', 'カバー画像'), spec: text('Tỉ lệ 16:9; thiếu ảnh thì dùng ảnh mặc định.', '16:9。未設定の場合はデフォルト画像。') },
        ],
        endpoints: ['GET /api/v1/courses/{slug}'],
      },
      tests: [
        test(
          text('Khóa học đang ẩn', 'コースが非公開'),
          text('Học viên mở đường dẫn của khóa học', '受講者がコースのURLを開く'),
          text('Hiện trang “Không tìm thấy”', '「見つかりません」画面を表示'),
        ),
      ],
    }),
    point({
      number: 2,
      title: text('Giá khóa học', 'コース価格'),
      box: [61, 12, 35.5, 16],
      basic: {
        summary: text('Hiện giá bán; khi khuyến mãi thì hiện thêm giá gốc gạch ngang.', '販売価格を表示。キャンペーン中は元の価格を取り消し線で表示。'),
        rules: [
          text('Giá hiển thị đã gồm thuế.', '表示価格は税込。'),
          text('Giá giảm chỉ hiện khi còn trong thời gian khuyến mãi.', '割引価格はキャンペーン期間中のみ表示。'),
        ],
      },
      detail: {
        rows: [
          { item: text('Định dạng', '表示形式'), spec: text('1.290.000 đ — dấu chấm ngăn cách hàng nghìn.', '1.290.000 đ（ドン、千区切りはピリオド）') },
          {
            item: text('Nguồn dữ liệu', 'データ元'),
            spec: text('courses.price, courses.sale_price, courses.sale_ends_at', 'courses.price, courses.sale_price, courses.sale_ends_at'),
          },
        ],
        endpoints: ['GET /api/v1/courses/{slug}'],
      },
      tests: [
        test(
          text('Khóa học đang khuyến mãi', 'キャンペーン中のコース'),
          text('Học viên mở trang chi tiết', '受講者が詳細画面を開く'),
          text('Hiện giá giảm và giá gốc gạch ngang', '割引価格と取り消し線付きの元価格を表示'),
        ),
        test(
          text('Khuyến mãi vừa hết hạn', 'キャンペーンが終了した直後'),
          text('Học viên tải lại trang', '受講者が画面を再読み込みする'),
          text('Chỉ hiện giá gốc', '元の価格のみ表示'),
        ),
      ],
      concepts: ['course-price'],
      history: [{ phase: 'Phase 2', note: text('Thêm giá giảm khi khuyến mãi.', 'キャンペーン割引価格を追加。') }],
      comments: [
        { id: 'c-1', authorInitials: 'Y', author: 'Yamada', role: 'PO', text: '割引率（-32%）も表示できますか？', at: '2026-10-20T03:00:00Z', mentions: [] },
        {
          id: 'c-2',
          authorInitials: 'MA',
          author: 'Minh Anh',
          role: 'BA',
          text: 'Được, sẽ thêm vào Phase 3. Đã ghi nhận.',
          at: '2026-10-20T04:10:00Z',
          mentions: [],
        },
      ],
    }),
    point({
      number: 3,
      title: text('Nút “Thêm vào giỏ”', '「カートに追加」ボタン'),
      box: [61, 31, 35.5, 10],
      basic: {
        summary: text('Thêm khóa học vào giỏ với giá đang hiển thị.', '表示中の価格でコースをカートに追加する。'),
        rules: [text('Ẩn nút khi học viên đã sở hữu khóa học.', '受講者が購入済みの場合はボタンを非表示。')],
      },
      detail: {
        rows: [
          {
            item: text('Sau khi bấm', '押下後'),
            spec: text('Cập nhật số lượng ở biểu tượng giỏ, không chuyển trang.', 'カートアイコンの件数を更新し、画面遷移しない。'),
          },
        ],
        endpoints: ['POST /api/v1/cart/items'],
      },
      tests: [
        test(
          text('Học viên chưa có khóa học', '受講者が未購入'),
          text('Bấm “Thêm vào giỏ”', '「カートに追加」を押す'),
          text('Giỏ hàng tăng thêm 1 khóa học', 'カートの件数が1件増える'),
        ),
      ],
      concepts: ['course-price'],
      dependsOn: ['SC-01#2'],
    }),
    point({
      number: 4,
      title: text('Nút “Học thử”', '「体験」ボタン'),
      box: [61, 44, 35.5, 10],
      basic: {
        summary: text('Mở bài học đầu tiên ở chế độ xem thử.', '最初のレッスンを体験モードで開く。'),
        rules: [text('Chỉ hiện với khóa học có bật học thử.', '体験が有効なコースのみ表示。')],
      },
      history: [{ phase: 'Phase 2', note: text('Đang chờ khách hàng duyệt.', '顧客の承認待ち。') }],
    }),
    point({
      number: 5,
      title: text('Nội dung khóa học', 'コース内容'),
      box: [3.5, 60, 54, 35],
      basic: {
        summary: text('Danh sách chương và số bài, thời lượng của từng chương.', '章の一覧と各章のレッスン数・時間。'),
        rules: [],
      },
    }),
  ],
};

const CART: ScreenSeed = {
  code: 'SC-02',
  name: text('Giỏ hàng', 'カート'),
  flow: PURCHASE_FLOW,
  purpose: text('Học viên xem lại khóa học đã chọn, nhập mã giảm giá và đi tới thanh toán.', '選択したコースを確認し、クーポンを入力して決済へ進む画面。'),
  image: { src: '/images/screens/cart.svg', width: 1200, height: 760 },
  points: [
    point({
      number: 1,
      title: text('Dòng khóa học trong giỏ', 'カート内のコース行'),
      box: [3.5, 16, 58, 26],
      basic: {
        summary: text('Tên, ảnh và giá của từng khóa học trong giỏ.', 'カート内の各コースの名前・画像・価格。'),
        rules: [text('Giá lấy tại thời điểm thêm vào giỏ.', '価格はカートに追加した時点のもの。')],
      },
      tests: [
        test(
          text('Khóa học đã trong giỏ', 'コースがカートにある'),
          text('Bấm “Xóa khỏi giỏ”', '「カートから削除」を押す'),
          text('Khóa học biến mất và tổng tiền được tính lại', 'コースが消え、合計が再計算される'),
        ),
      ],
      concepts: ['course-price'],
      dependsOn: ['SC-01#3'],
    }),
    point({
      number: 2,
      title: text('Ô nhập mã giảm giá', 'クーポン入力欄'),
      box: [65, 16, 31.5, 20],
      basic: {
        summary: text('Học viên nhập mã và bấm “Áp dụng”.', '受講者がコードを入力し「適用」を押す。'),
        rules: [
          text('Mỗi mã chỉ dùng một lần cho mỗi tài khoản.', '1つのコードは1アカウントにつき1回まで。'),
          text('Mã hết hạn thì báo lỗi ngay dưới ô nhập.', null),
        ],
      },
      detail: {
        rows: [
          { item: text('Định dạng mã', 'コード形式'), spec: text('Chữ in hoa và số, 4–20 ký tự.', '英大文字と数字、4〜20文字。') },
          {
            item: text('Thông báo lỗi', 'エラーメッセージ'),
            spec: text('Hiện dưới ô nhập, màu đỏ, không xóa mã đã nhập.', '入力欄の下に赤字で表示し、入力値は消さない。'),
          },
        ],
        endpoints: ['POST /api/v1/cart/coupon'],
      },
      tests: [
        test(
          text('Mã còn hạn, chưa dùng', '有効期限内・未使用のコード'),
          text('Bấm “Áp dụng”', '「適用」を押す'),
          text('Hiện “Đã áp dụng” và số tiền giảm', '「適用済み」と割引額を表示'),
        ),
        test(text('Mã đã hết hạn', '期限切れのコード'), text('Bấm “Áp dụng”', null), text('Báo lỗi, tổng tiền không đổi', null)),
      ],
      concepts: ['coupon'],
    }),
    point({
      number: 3,
      title: text('Tạm tính và tổng tiền', '小計と合計'),
      box: [65, 40, 31.5, 26],
      basic: {
        summary: text('Tạm tính là tổng giá khóa học; tổng tiền là tạm tính trừ giảm giá.', '小計はコース価格の合計、合計は小計から割引を引いた額。'),
        rules: [text('Tổng tiền không bao giờ nhỏ hơn 0.', '合計は0未満にならない。')],
      },
      concepts: ['course-price', 'coupon', 'order-total'],
      dependsOn: ['SC-02#1', 'SC-02#2'],
    }),
    point({
      number: 4,
      title: text('Nút “Thanh toán”', '「決済へ」ボタン'),
      box: [65, 70, 31.5, 11],
      basic: {
        summary: text('Tạo đơn hàng với tổng tiền hiện tại và chuyển sang trang thanh toán.', '現在の合計で注文を作成し、決済画面へ遷移する。'),
        rules: [text('Bắt đầu đếm thời gian giữ đơn 30 phút.', '30分の注文保持時間を開始する。')],
      },
      detail: { rows: [], endpoints: ['POST /api/v1/orders'] },
      concepts: ['order-hold'],
      dependsOn: ['SC-02#3'],
    }),
  ],
};

const CHECKOUT: ScreenSeed = {
  code: 'SC-03',
  name: text('Thanh toán', '決済'),
  flow: PURCHASE_FLOW,
  purpose: text('Học viên chọn phương thức và xác nhận thanh toán trong thời gian giữ đơn.', '保持時間内に支払方法を選び、決済を確定する画面。'),
  image: { src: '/images/screens/checkout.svg', width: 1200, height: 760 },
  points: [
    point({
      number: 1,
      title: text('Tóm tắt đơn hàng', '注文概要'),
      box: [61, 12, 35.5, 40],
      basic: {
        summary: text('Khóa học, giảm giá và tổng tiền của đơn đã tạo.', '作成済み注文のコース・割引・合計。'),
        rules: [text('Không sửa được đơn ở bước này.', 'このステップでは注文を変更できない。')],
      },
      concepts: ['course-price', 'order-total'],
      dependsOn: ['SC-02#3'],
    }),
    point({
      number: 2,
      title: text('Chọn phương thức thanh toán', '支払方法の選択'),
      box: [3.5, 22, 54, 40],
      basic: {
        summary: text('Thẻ ngân hàng hoặc ví điện tử. Trả góp hiện ở trạng thái “Sắp có”.', '銀行カードまたは電子ウォレット。分割払いは「近日公開」と表示。'),
        rules: [text('Mặc định chọn thẻ ngân hàng.', 'デフォルトは銀行カード。')],
      },
      concepts: ['payment-method'],
      history: [{ phase: 'Phase 2', note: text('Đề xuất thêm trả góp, chờ duyệt.', '分割払いの追加を提案中（承認待ち）。') }],
    }),
    point({
      number: 3,
      title: text('Đồng hồ giữ đơn', '注文保持タイマー'),
      box: [3.5, 10, 54, 9],
      basic: {
        summary: text('Đếm ngược 30 phút từ lúc tạo đơn.', '注文作成から30分をカウントダウンする。'),
        rules: [text('Hết giờ thì đơn tự hủy và trả lại mã giảm giá.', null)],
      },
      tests: [
        test(
          text('Đơn đã tạo 30 phút, chưa thanh toán', '作成から30分経過・未払い'),
          text('Đồng hồ về 0', 'タイマーが0になる'),
          text('Đơn bị hủy, mã giảm giá dùng lại được', '注文がキャンセルされ、クーポンが再利用可能になる'),
        ),
      ],
      concepts: ['order-hold', 'coupon'],
      dependsOn: ['SC-02#4'],
    }),
    point({
      number: 4,
      title: text('Nút “Xác nhận thanh toán”', '「支払を確定」ボタン'),
      box: [3.5, 68, 54, 11],
      basic: {
        summary: text('Gửi yêu cầu tới cổng thanh toán.', '決済ゲートウェイへリクエストを送る。'),
        rules: [text('Thất bại thì giữ nguyên đơn và báo lý do dễ hiểu.', '失敗した場合は注文を保持し、分かりやすい理由を表示する。')],
      },
      detail: {
        rows: [
          { item: text('Chống bấm hai lần', '二重送信防止'), spec: text('Khóa nút cho tới khi có kết quả.', '結果が返るまでボタンを無効化。') },
          {
            item: text('Thành công', '成功時'),
            spec: text('Chuyển sang trang “Khóa học của tôi”, gửi email biên nhận.', '「マイコース」へ遷移し、領収メールを送信。'),
          },
        ],
        endpoints: ['POST /api/v1/orders/{id}/pay'],
      },
      tests: [
        test(
          text('Thẻ hợp lệ', '有効なカード'),
          text('Bấm “Xác nhận thanh toán”', '「支払を確定」を押す'),
          text('Đơn “Đã thanh toán”, vào học được ngay', '注文が「支払済み」になり、すぐ受講できる'),
        ),
        test(
          text('Thẻ bị từ chối', 'カードが拒否される'),
          text('Bấm “Xác nhận thanh toán”', '「支払を確定」を押す'),
          text('Hiện lý do, giỏ hàng giữ nguyên', '理由を表示し、カートはそのまま'),
        ),
      ],
      concepts: ['payment-method', 'order-total'],
      dependsOn: ['SC-03#1', 'SC-03#2'],
    }),
  ],
};

// Ids are stable and readable in assertions: screen `screen-SC-01`, point `SC-01-2`.
function withIds(screen: ScreenSeed): ScreenRecord {
  return {
    ...screen,
    id: `screen-${screen.code}`,
    source: { kind: 'image', url: null, width: null },
    features: [],
    points: screen.points.map((item) => ({ ...item, id: `${screen.code}-${item.number}` })),
  };
}

export const DEMO_PROJECTS: readonly ProjectRecord[] = [
  {
    code: 'LMS',
    name: text('Cổng học trực tuyến', 'オンライン学習ポータル'),
    description: text('Bán và học khóa học trực tuyến cho trung tâm đào tạo.', '研修センター向けのオンラインコース販売・学習サービス。'),
    myRole: 'ba',
    archivedAt: null,
    permissions: { canEditDesign: true, canEditPlan: true, canManageMembers: false, canEditProject: false, canArchive: false, canDelete: false },
    concepts: LEARNING_CONCEPTS,
    screens: [COURSE_DETAIL, CART, CHECKOUT].map(withIds),
  },
  {
    code: 'HRM',
    name: text('Quản lý nhân sự', '人事管理'),
    description: text('Chấm công, nghỉ phép và hồ sơ nhân viên.', null),
    myRole: 'customer',
    archivedAt: null,
    permissions: { canEditDesign: false, canEditPlan: false, canManageMembers: false, canEditProject: false, canArchive: false, canDelete: false },
    concepts: [],
    screens: [],
  },
];
