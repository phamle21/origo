# renderer

Dịch vụ nội bộ chụp **HTML tải lên** hoặc **một URL công khai** thành ảnh PNG cho bản đồ màn hình Origo. Chỉ API gọi tới; không mở ra ngoài.

- Chrome chạy ngầm bằng Playwright 1.55 (image `mcr.microsoft.com/playwright:v1.55.0-noble`).
- `POST /render` — JSON:
  - `{ "kind": "html", "width": 1440, "entry": "index.html", "files": { "<đường dẫn tương đối>": "<base64>" } }`
  - `{ "kind": "url", "width": 390, "url": "https://…" }`
  - Trả `image/png` (chụp cả trang, tối đa cao 8000px). `width` chỉ nhận 390, 1024, 1440.
- `GET /health`.

## An toàn

HTML và URL đều do người dùng đưa vào, nên:

- Mọi yêu cầu mạng của trang được kiểm tra: chỉ cho `http(s)` tới **địa chỉ công khai**, `data:` và `blob:`; chặn mạng nội bộ, localhost, metadata đám mây, `file://` ngoài thư mục tải lên. Cho phép riêng một số máy nội bộ bằng biến `ALLOWED_PRIVATE_HOSTS` (danh sách cách nhau bởi dấu phẩy).
- Container chạy bằng user thường (`pwuser`) trên mạng Docker riêng, chỉ API thấy được.
- Giới hạn: body 16MB, mở trang 20 giây, 2 lần chụp cùng lúc, tối đa 6 yêu cầu chờ (quá thì trả 429).

## Lệnh

Chạy từ thư mục `docker/`:

```bash
docker compose build renderer
docker compose up -d renderer
docker compose run --rm --no-deps renderer npm test
```
