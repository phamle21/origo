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
- Cài lần đầu bằng `php artisan origo:install` (migration + tạo quản trị viên đầu tiên); kiểm tra sức khỏe ở `GET /api/health`.
- Image Docker cho amd64 và arm64 trên GHCR: `origo-api`, `origo-web`, `origo-renderer`.
