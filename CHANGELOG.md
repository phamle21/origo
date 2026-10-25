# Nhật ký phiên bản Origo

Origo đánh số theo [Semantic Versioning](https://semver.org/lang/vi/): `MAJOR.MINOR.PATCH`.
Ba phần (`api`, `web`, `renderer`) luôn mang **cùng một số phiên bản** và được phát hành cùng nhau.

| Phần tăng | Khi nào | Ví dụ |
|---|---|---|
| PATCH | Sửa lỗi, không thêm tính năng, không đổi cách dùng | 1.0.0 → 1.0.1 |
| MINOR | Thêm tính năng mới, dữ liệu và cách dùng cũ vẫn chạy | 1.0.1 → 1.1.0 |
| MAJOR | Thay đổi làm cách dùng cũ không còn đúng (đổi API, phải chuyển dữ liệu theo cách thủ công…) | 1.4.2 → 2.0.0 |

Bản thử trước khi phát hành thêm hậu tố: `1.1.0-rc.1`.

Số phiên bản nằm ở: `web/package.json` (`version`), `api/VERSION`, `renderer/package.json` (`version`); `scripts/release.sh` dừng nếu ba chỗ không khớp.
Người dùng thấy nó ở cuối menu tài khoản và dưới trang đăng nhập; máy giám sát đọc ở `GET /api/health`.

---

## Chưa phát hành (dự kiến 1.1.0)

**Kế hoạch theo dõi như file quản lý dự án**
- Mỗi lịch có thêm công dự tính (ngày công), % đã xong, link/tài liệu, ghi chú; tính năng có mức ưu tiên P1–P5.
- Trạng thái riêng cho từng dự án (ví dụ Mới, Phân tích, Đang làm, Đang kiểm tra, Xong, Từ chối, Tạm dừng, Đang chờ), mỗi trạng thái thuộc nhóm Chưa làm / Đang làm / Xong.
- Giai đoạn có khung thời gian và bên phụ trách (VN, JP, khách…).
- Tổng quan tiến độ: dự tính / đã làm / còn lại theo giai đoạn và toàn dự án, thời gian đã qua theo ngày làm việc, cảnh báo chậm tiến độ và giai đoạn trễ.
- Lịch làm việc chung (Cài đặt → Lịch làm việc): ngày nghỉ lễ và ngày làm bù.
- Báo cáo tuần: tự chốt số liệu mỗi sáng thứ Hai (`origo:plan-weekly-snapshot`), chốt tay bất kỳ lúc nào, nhận xét tuần đa ngôn ngữ, giờ làm theo người.
- Xuất Excel vào **chính file quản lý dự án của nhóm** (Cài đặt → Mẫu Excel): tải lên một file thật đã điền, Origo xóa dữ liệu cũ, giữ nguyên bố cục, công thức, màu, ô chọn; khi xuất chỉ điền vào các ô người ta vẫn gõ tay. Công thức Google Sheets (`__xludf.DUMMYFUNCTION`) được giữ và cập nhật kết quả lưu sẵn để mở bằng Excel vẫn đúng.
- Khi chưa có mẫu, xuất Excel theo bố cục riêng của Origo (Gantt Chart, Weekly Report, .setting).
- Dạng Bảng: cột tên cố định, tên dài tự xuống dòng; ô giai đoạn hiện trạng thái, công và %.

**Kỹ thuật**
- API cần thêm gói `phpoffice/phpspreadsheet`; 3 migration mới (`plan_statuses`, `work_calendar_days`, `plan_weekly_reports` + `plan_timesheet_entries`, thêm cột cho `plan_tasks`, `plan_items`, `plan_stages`).
- Cần chạy `queue`/`scheduler` như trước; lịch chốt tuần nằm trong `routes/console.php`.

## 1.0.0 — 2026-10-24 (phát hành đầu tiên)

**Dự án và thiết kế**
- Danh sách dự án dạng lưới / danh sách, tìm, lọc theo trạng thái và vai trò, sắp xếp.
- Bản đồ màn hình: ảnh có đánh số; mỗi số có thiết kế cơ bản, chi tiết, test, ảnh hưởng, góp ý.
- Tạo màn hình từ ảnh, HTML hoặc URL (chụp tự động); sửa, chụp lại, xóa màn hình.
- Thông tin dự án; lưu trữ (chỉ xem) và xóa hoàn toàn, bắt gõ mã dự án để xác nhận.

**Kế hoạch**
- Biểu đồ Gantt và bảng: kéo dời, kéo mép đổi ngày, kéo đổi thứ tự (khung nét đứt), chuột phải đổi trạng thái.
- Bộ lọc (tên, người phụ trách, giai đoạn, trạng thái, trễ hạn), toàn màn hình, thu phóng.
- Bấm một giai đoạn chỉ hiện giai đoạn đó; dòng đã xong tô xanh; ghi chú cho tính năng.
- Giai đoạn riêng mỗi dự án (đổi tên, màu, thứ tự) và giai đoạn mặc định.

**Thành viên và phân quyền**
- Trang thành viên: thêm người, đổi vai trò, số lịch đang phụ trách.
- Vai trò hệ thống và vai trò dự án tự tạo; danh mục quyền sửa được tên, mô tả, nhóm.
- Chốt chặn: luôn còn người quản lý cài đặt; mỗi dự án luôn còn người quản lý thành viên.

**Cộng tác**
- Góp ý có gắn tên @; thông báo (gắn tên, thêm vào dự án, đổi vai trò, giao lịch).
- Nhiều ngôn ngữ nội dung, có dịch tự động miễn phí.
- Trang hướng dẫn có hình chụp thật; giao diện sáng / tối; tiếng Việt, Nhật, Anh.

**Cài đặt**
- Bản phát hành không kèm dữ liệu mẫu hay tài khoản demo; migration tạo sẵn quyền, vai trò, ngôn ngữ mặc định.
- Cài lần đầu bằng màn hình `/install` trên web hoặc lệnh `php artisan origo:install` (migration + tạo quản trị viên đầu tiên); ở production màn hình cài đặt cần `INSTALL_TOKEN`. Kiểm tra sức khỏe ở `GET /api/health`.
- Image Docker cho amd64 và arm64 trên GHCR: `origo-api`, `origo-web`, `origo-renderer`.
