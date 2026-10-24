# web

Giao diện của Origo, dựng trên bộ khung **Nuxt SSR Starter** (giấy phép MIT, xem `LICENSE`): Nuxt 4 SSR, Vue 3, TypeScript, Tailwind CSS 4, `@nuxtjs/i18n`, Zod, Pinia, Vitest, Storybook, Oxlint/Oxfmt. Yarn 4.13, Node 24.14.

- Ứng dụng: http://localhost:3310 (tiếng Việt), http://localhost:3310/ja (tiếng Nhật), http://localhost:3310/en (tiếng Anh)
- Storybook (xem từng thành phần giao diện): http://localhost:6306 — bật bằng `docker compose --profile review up -d storybook` trong `../docker`
- Dữ liệu lấy từ Laravel (`../api`) qua server Nuxt; trình duyệt không gọi thẳng Laravel. Cần đăng nhập (tài khoản đầu tiên: `php artisan origo:install`, xem `../api/README.md`).

Kiến trúc và quy tắc phụ thuộc giữa các lớp: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Cách dùng

**Người xem** (Dev, QA, PO, khách): chọn dự án → chọn màn hình → bấm số trên ảnh → bảng bên phải có 5 tab:

| Tab | Dành cho | Nội dung |
|---|---|---|
| Cơ bản (基本設計) | BA, PO, khách hàng | Chỗ này làm gì, quy tắc nghiệp vụ, thay đổi theo phase |
| Chi tiết (詳細設計) | Dev | Bảng mục – đặc tả, API |
| Test (テスト) | QA | Các trường hợp Cho trước / Khi / Thì |
| Ảnh hưởng (影響範囲) | Tất cả | Phụ thuộc vào đâu, đổi thì ảnh hưởng tới đâu (tự tính) |
| Góp ý (コメント) | Tất cả | Câu hỏi, góp ý trên đúng số đó (lưu thật) |

Đường dẫn giữ cả số và tab, ví dụ gửi cho QA: `/p/LMS/SC-02?point=2&tab=tests`.

**Người sửa** (BA, vai trò `editor`):

1. **Thêm màn hình** (`/p/{code}/new`): tên Việt/Nhật, luồng, mục đích và **một nguồn ảnh**:
   - **Ảnh chụp**: kéo thả, chọn tệp hoặc **Ctrl+V** dán ảnh vừa chụp.
   - **HTML / ZIP**: tệp `.html`, hoặc `.zip` có `index.html` cùng CSS, ảnh — hệ thống tự chụp (dùng được Tailwind/CDN công khai).
   - **Đường dẫn web**: trang công khai (chưa hỗ trợ trang cần đăng nhập).
   - HTML và URL chụp ở cỡ Máy tính 1440 / Máy tính bảng 1024 / Điện thoại 390. Ảnh luôn được lưu dạng WebP.
2. **Chỉnh sửa** (`/p/{code}/{SC-xx}/edit`):
   - Kéo chuột trên ảnh để thêm số; kéo khung để di chuyển, kéo góc để đổi kích thước; phím mũi tên / Shift + mũi tên / Delete khi đang chọn khung.
   - Danh sách số bên dưới: ↑ ↓ để đổi thứ tự (số tự đánh lại), ✕ để xóa.
   - Bên phải: form 4 tab, mỗi ô có Tiếng Việt và 日本語; tạo khái niệm mới ngay trong tab Ảnh hưởng; chọn "Phụ thuộc vào" từ mọi số đã lưu của dự án.
   - **Lưu** gửi cả màn hình một lần; rời trang khi chưa lưu sẽ được hỏi lại.
   - **Chụp lại** (màn hình từ HTML/URL) hoặc **Đổi nguồn**: các số giữ nguyên chỗ (vị trí tính theo %).

### Ngôn ngữ

- Nút **Tiếng Việt / 日本語 / English** ở đầu trang đổi ngôn ngữ giao diện; nội dung đặc tả đi theo (Việt hoặc Nhật; English dùng nội dung tiếng Việt).
- Ô **"Hiện song ngữ Việt – Nhật"** hiện cả hai bản dưới mỗi đoạn để BA đối chiếu bản dịch; lựa chọn được nhớ bằng cookie.
- Đoạn chưa dịch hiện bản còn lại kèm nhãn **Chưa dịch / 未翻訳**.

### Ảnh hưởng được tính thế nào

Mỗi số khai báo **khái niệm nghiệp vụ** nó dùng (ví dụ *Giá khóa học*) và các số nó **phụ thuộc** (`SC-01#3`). `server/services/screen/screen.ts` tự tính phần còn lại: số nào phụ thuộc ngược lại, số nào dùng chung khái niệm. Vị trí khung số tính theo % ảnh.

## Lệnh

Chạy qua Docker từ `../docker` (máy không cần Node):

```bash
docker compose exec web yarn verify:quick      # định dạng, lint, kiểm tra kiểu, test
docker compose exec web yarn test:coverage     # test + ngưỡng độ phủ
docker compose exec web yarn build             # build production
docker compose exec web yarn build-storybook   # build Storybook
docker compose run --rm --no-deps web yarn install   # cài lại thư viện
```

| Lệnh | Việc |
|---|---|
| `yarn dev` | Chạy dev server (container `origo-web` tự chạy lệnh này) |
| `yarn storybook` | Storybook (container `origo-storybook`) |
| `yarn format` / `yarn format:check` | Định dạng bằng Oxfmt |
| `yarn lint` | Oxlint |
| `yarn type-check` | Kiểm tra kiểu |
| `yarn verify` | Kiểm tra đầy đủ trước khi bàn giao |

## Ghi chú so với starter gốc

- Ngôn ngữ mặc định là tiếng Việt, thêm tiếng Nhật; tiếng Anh vẫn là ngôn ngữ gốc để viết thông điệp (`nuxt.config.ts`).
- Đã bỏ phần mẫu `example`, `AppHeader` và store điều hướng; chỉ giữ một miền nghiệp vụ là bản đồ màn hình.
- Dev server nhận thêm tên miền qua biến `DEV_ALLOWED_HOSTS` (cách nhau bởi dấu phẩy), ví dụ khi chạy sau một reverse proxy local.
