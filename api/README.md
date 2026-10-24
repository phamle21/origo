# api

API của Origo: Laravel 13, PHP 8.5 (FrankenPHP), PostgreSQL 18, Redis 8, Sanctum, Pennant, Scramble.

- Local: http://localhost:8310
- Kiểm tra: http://localhost:8310/api/health
- Tài liệu API (tự sinh, chỉ ở local): http://localhost:8310/docs/api

## Module

```
modules/
├── Core/             # lõi nghiệp vụ: model, action, policy, migration — không biết gì về HTTP
│   ├── Account/      # tài khoản: tạo, khóa, cấp quyền quản trị, mật khẩu tạm
│   ├── Plan/         # kế hoạch: giai đoạn, phase → module → tính năng, lịch từng giai đoạn
│   ├── Project/      # dự án (tên, mô tả song ngữ), thành viên và vai trò
│   └── Screen/       # bản đồ màn hình: màn hình, số, khái niệm, phụ thuộc, góp ý, ảnh WebP
└── Application/      # cửa vào: gọi lõi qua action, không chứa nghiệp vụ
    └── ApiV1/        # /api/v1 — controller, request, resource, route
```

Mỗi module là một gói Composer nằm trong repo (`composer.json` riêng, nạp qua `repositories.modules` kiểu `path`, liên kết tượng trưng vào `vendor/origo/*`). ServiceProvider của module được Laravel tự nhận qua `extra.laravel.providers`.

Quy tắc:

- **Application → Core**, không bao giờ ngược lại. Module Application khai báo lõi nó dùng trong `require` (ví dụ `"origo/core-project": "^1.0"`).
- Core không gọi Core khác bằng cách sửa thẳng bảng của nhau; dùng action hoặc sự kiện.
- Namespace: `Origo\Core\<Module>`, `Origo\Application\<Module>`. Tên gói: `origo/core-<module>`, `origo/app-<module>`.
- Test nằm trong `modules/*/*/tests`, chạy chung với `php artisan test`.

### Thêm module mới

1. Chép cấu trúc của `modules/Core/Project` (hoặc `modules/Application/ApiV1`), đổi tên namespace, tên gói, provider.
2. Thêm vào gói gốc:
   ```bash
   docker compose exec api composer require origo/core-<module>:^1.0
   ```

### API v2

Tạo `modules/Application/ApiV2` (prefix `api/v2`, name `api.v2.`), dùng lại action của Core, chỉ viết lại controller/resource có thay đổi phá vỡ. Chỉ tạo khi có thay đổi làm hỏng client đang dùng v1.

### Bật/tắt tính năng (Pennant)

Khai báo cờ trong ServiceProvider của module sở hữu tính năng, theo phạm vi dự án:

```php
Feature::define('screen-map', fn (Project $project) => false);
```

Web đọc cờ qua `GET /api/v1/projects/{project}/features`.

## Bản đồ màn hình — API v1

Mọi route cần token Sanctum, trừ đăng nhập; tài khoản bị khóa bị từ chối ở mọi route.

### Quyền

Hai tầng, cộng dồn với nhau:

- **Vai trò hệ thống** (`users.system_role_id` → `system_roles`): mỗi người một vai trò, là gói các quyền trong `App\Enums\SystemPermission`: `users.manage`, `settings.manage`, `projects.create`, `projects.view_all`, `projects.manage_all`. Có sẵn `admin` (luôn đủ mọi quyền, không xóa được) và `member` (mặc định cho tài khoản mới); quản trị viên tạo thêm vai trò khác (ví dụ PMO) ở Cài đặt.
- **Vai trò dự án** (`project_members.role`): `manager`, `ba`, `dev`, `qa`, `customer`. Quyền của từng vai trò (sửa kế hoạch / sửa thiết kế / quản lý thành viên) lưu ở `project_role_rights` và tick được ở Cài đặt; `manager` luôn đủ quyền.

`ProjectPolicy`: có `projects.manage_all` thì làm được mọi việc trong mọi dự án; `projects.view_all` thì xem được mọi dự án; còn lại theo vai trò trong dự án. Ai cũng xem và góp ý được trong dự án của mình. Dự án luôn phải còn ít nhất một `manager`; hệ thống luôn phải còn ít nhất một quản trị viên đang hoạt động.

| Method | Đường dẫn | Việc |
|---|---|---|
| POST | `/api/v1/auth/login` | Đăng nhập, trả token (hết hạn sau 14 ngày; tối đa 6 lần/phút) |
| POST | `/api/v1/auth/logout` · GET `/api/v1/me` | Đăng xuất · người đang đăng nhập |
| GET | `/api/v1/projects/{code}/map` | Toàn bộ bản đồ màn hình của dự án (một lần đọc) |
| POST | `/api/v1/projects/{code}/screens` | Tạo màn hình (multipart: `name[vi]`, `name[ja]`, `flow[…]`, `purpose[…]` và **đúng một** nguồn: `image`, `html` (.html/.htm/.zip) hoặc `url`; kèm `width` 1440/1024/390 cho HTML/URL); mã `SC-NN` tự sinh, không bao giờ cấp lại mã đã dùng |
| PATCH / DELETE | `/api/v1/projects/{code}/screens/{SC-xx}` | Sửa tên/luồng/mục đích · xóa (kèm ảnh, số, góp ý) |
| POST | `/api/v1/projects/{code}/screens/{SC-xx}/image` | Đổi nguồn ảnh (cùng kiểu nguồn như khi tạo), giữ nguyên các số |
| POST | `/api/v1/projects/{code}/screens/{SC-xx}/recapture` | Chụp lại màn hình tạo từ HTML/URL |
| PUT | `/api/v1/projects/{code}/screens/{SC-xx}/points` | Lưu cả bộ số: thứ tự mảng = số thứ tự, có `id` thì cập nhật, không có thì tạo, thiếu thì xóa |
| POST | `/api/v1/projects/{code}/concepts` | Tạo khái niệm (key sinh từ tên tiếng Việt) |
| POST | `/api/v1/points/{id}/comments` | Góp ý |
| GET / POST | `/api/v1/projects/{code}/members` | Thành viên · thêm (`userId`, `role`) |
| PATCH / DELETE | `/api/v1/projects/{code}/members/{id}` | Đổi vai trò · bỏ ra |
| GET | `/api/v1/users/lookup?q=` | Tìm tài khoản để thêm vào dự án (≥ 2 ký tự, tối đa 20 kết quả) |
| GET / POST | `/api/v1/admin/users` | (`users.manage`) Danh sách, tìm `q` · tạo tài khoản (`systemRoleId`), trả mật khẩu tạm một lần |
| GET · PATCH | `/api/v1/admin/users/{id}` | (`users.manage`) Xem · sửa tên/email/chức danh, `systemRoleId`, `isActive` (khóa thì thu hồi token) |
| GET · POST · PATCH · DELETE | `/api/v1/admin/system-roles[/{id}]` | (`settings.manage`; xem danh sách thì `users.manage` cũng được) Vai trò hệ thống |
| GET · PUT | `/api/v1/admin/settings/project-roles` | (`settings.manage`) Quyền của từng vai trò dự án |
| GET · PUT | `/api/v1/admin/settings/stage-template` | (`settings.manage`) Giai đoạn mặc định cho dự án mới |
| PATCH · PUT | `/api/v1/me` · `/api/v1/me/password` | Tự đổi tên · tự đổi mật khẩu (cần mật khẩu hiện tại, các thiết bị khác bị đăng xuất) |
| POST | `/api/v1/admin/users/{id}/reset-password` | (`users.manage`) Cấp mật khẩu tạm mới |
| POST | `/api/v1/projects` | (`projects.create`) Tạo dự án, `managerId` tùy chọn |
| GET | `/api/v1/projects/{code}/plan` | Cả kế hoạch: giai đoạn, cây hạng mục, lịch, màn hình liên kết, `canEdit` |
| PUT | `/api/v1/projects/{code}/plan/stages` | Lưu cả bộ giai đoạn (thứ tự mảng = thứ tự cột) |
| POST · PATCH · DELETE | `/api/v1/projects/{code}/plan/items[/{id}]` | Thêm (phase → module → tính năng) · đổi tên/`move` up/down · xóa (kèm mục con) |
| PUT / DELETE | `/api/v1/projects/{code}/plan/items/{id}/tasks/{stage}` | Lịch một giai đoạn của tính năng (`startDate`, `endDate`, `status`, `assigneeId`) |
| PUT | `/api/v1/projects/{code}/plan/items/{id}/screens` | Gắn màn hình thiết kế (`screenCodes`) |

Văn bản đa ngôn ngữ lưu dạng JSON theo mã ngôn ngữ, ví dụ `{"vi": …, "ja": …, "en": …}` (`Origo\Core\Project\Support\LocalizedText`). Danh sách ngôn ngữ nằm ở bảng `content_languages` (`ContentLanguages`): `vi` là mặc định, luôn đứng đầu, bắt buộc; quản trị thêm/bật/tắt ở `PUT /api/v1/admin/settings/content-languages` (`settings.manage`), mọi người đọc danh sách đang bật ở `GET /api/v1/content-languages`. Ngôn ngữ chỉ tắt được, không xóa; bản dịch của ngôn ngữ đang tắt vẫn được giữ khi sửa nội dung. Ảnh tải lên được đọc lại và lưu thành WebP trên disk `public` với tên ngẫu nhiên.

HTML và URL được chụp bởi dịch vụ `renderer` (`RENDERER_URL`, mặc định `http://origo-renderer:3000`). Gói ZIP được kiểm tra trước khi gửi: tối đa 300 tệp, 30MB sau giải nén, không có đường dẫn thoát khỏi thư mục. Tệp HTML/ZIP gốc giữ trên disk `local` (`screen-sources/`) để chụp lại; bị xóa khi đổi sang nguồn khác hoặc xóa màn hình.

### Dữ liệu nền và tài khoản đầu tiên

Không có dữ liệu mẫu hay tài khoản demo. `php artisan migrate` tự tạo danh mục quyền, vai trò mặc định và hai ngôn ngữ nội dung (`vi`, `ja`); `db:seed` chỉ bổ sung lại danh mục quyền và vai trò nếu thiếu, chạy lại không đổi gì. Lần cài đầu chạy `php artisan origo:install`: kiểm tra khóa ứng dụng và CSDL, chạy migration, tạo liên kết `storage`, rồi hỏi email, tên và mật khẩu của quản trị viên đầu tiên (để trống mật khẩu thì in mật khẩu tạm một lần). Chạy lại không tạo thêm quản trị viên. Không hỏi được (CI, script) thì truyền `--email` và `--name`. `php artisan origo:create-admin email "Họ tên"` vẫn dùng được để thêm quản trị viên.

## Lệnh

Chạy từ thư mục `docker/`:

```bash
docker compose exec api php artisan origo:install
docker compose exec api php artisan migrate
docker compose exec api php artisan test
docker compose exec api vendor/bin/pint
```

Cài đặt và vận hành: xem `../README.md`.
