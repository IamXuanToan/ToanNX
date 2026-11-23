# Module Utilities (`utilities`)

Tiện ích: link rút gọn `/s/{slug}`, mã QR (VietQR, liên kết, văn bản; ảnh lưu vào Thư viện) và trang tùy chỉnh
`/<đường dẫn giữa>/<slug>` soạn bằng Tiptap (JSON). Phụ thuộc `system`.

- BE: `backend/app/utilities/` · FE: `frontend/src/modules/utilities/`
- URL quản trị: `/quan-tri/tien-ich/...` · nhóm `content`

## Model

`ShortLink` (lưu trữ `clicks_count` - tổng lượt truy cập, `visitors_count` - số người vào duy nhất, `last_accessed_at` - truy cập gần nhất), `QrCode`, `Page`, `PagePath` (đường dẫn giữa dùng chung cho nhiều trang).

## Quyền

| Class | Tài nguyên | `MEMBER` |
| --- | --- | --- |
| `ShortLinkPermission` | `short_link` (+ `manage_all`) | read, create, update, delete |
| `QrCodePermission` | `qr_code` (+ `manage_all`) | read, create, update, delete |
| `PagePermission` | `page` (+ `manage_all`) | read, create, update, delete |
| `PagePathPermission` | `page_path` | read |

## Màn quản trị

Một cụm (4 mục): Link rút gọn (`link-rut-gon`) · Mã QR (`ma-qr`) · Trang (`trang`) · Đường dẫn (`duong-dan`).
Mỗi màn có danh sách, tạo mới, chi tiết (chỉ xem, `?mode=edit` để sửa).

## Trang công khai

- `/s/{slug}`: chuyển hướng link rút gọn (link khóa thì hỏi mật khẩu, hết hạn thì trang báo không còn).
  URL rút gọn hiển thị trong quản trị được dựng theo origin của Frontend (`get_frontend_origin(request)` / `https://www.toannx.com/s/...`) thay vì domain Backend.
  - **Thống kê lượt người vào và an toàn đồng thời (concurrency):**
    + Khi 2 người (hoặc nhiều người) cùng truy cập tại cùng một thời điểm: ghi nhận bằng `F("clicks_count") + 1`
      và `F("visitors_count") + 1` ở tầng Database (PostgreSQL row-level lock atomic increment), đảm bảo không bị
      lost update hay race condition.
    + Phân biệt người vào: kết hợp `(client_ip, user_agent)` thành fingerprint riêng biệt. 2 người ở cùng một mạng
      Wi-Fi (cùng IP công cộng) nhưng dùng thiết bị khác nhau (ví dụ laptop Chrome và điện thoại Safari) được nhận diện
      chính xác là 2 người vào riêng biệt và cộng đủ cả 2.
    + Chống click ảo / spam: debounce 3 giây bỏ qua double-click hoặc reload tức thì; trong vòng 24 giờ, cùng một người
      chỉ được tính là 1 visitor (`visitors_count`), các lần truy cập tiếp theo chỉ tăng tổng số click (`clicks_count`).
- `/<đường dẫn>/<slug>`: trang tùy chỉnh, render bằng `TiptapContent`. Ảnh trong trang phải là file công khai.
- Cache Redis (`constants/public_cache.py`, namespace `utilities:public`): link công khai và trang **đã xuất bản**
  được cache 10 phút (slug không tồn tại: 60 giây), nên lượt khách lặp lại không chạm Neon. `ShortLinkService`,
  `PageService`, `PagePathService`, `QrCodeService` khai `public_cache_namespace`: mọi ghi tăng version sau commit
  nên cache cũ hết hiệu lực ngay. Link có mật khẩu chỉ cache cờ "có khóa" (không mã băm, không URL đích); mở khóa
  luôn kiểm ở DB. Bản nháp không bao giờ cache. Không có `REDIS_URL` thì đọc DB như cũ.

## Sự kiện, webhook, callback

Không có.

## Chức năng liên quan

[File công khai và riêng tư](../../features/attachment-visibility.md) (logo QR, ảnh trong trang phải công khai).
