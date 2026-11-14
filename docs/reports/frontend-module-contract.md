# Frontend contract — Short Links & Custom Pages

Ngày 14/11/2026. Phạm vi đã chốt với chủ dự án: **hai module** `short_links` và `custom_pages`. QR là block trong Custom Pages; không có module, bảng, quyền hay URL `/qr/{slug}` độc lập. Chưa sửa frontend trong phase này.

## Quy ước chung

- Gọi cùng origin qua `/api/v1/*` bằng `apiClient` hiện có. Backend nhận/trả `snake_case`; `apiClient` đổi sang `camelCase` tại frontend. Các ví dụ dưới đây dùng dạng wire `snake_case`.
- Thành công: `{ "success": true, "data": ..., "meta": { "request_id": "..." } }`; danh sách có `meta.pagination = {page, page_size, total, total_pages}`. Lỗi: `{ "success": false, "error": { "code": "...", "message": "...", "details": ..., "request_id": "..." } }`.
- Người dùng phải đăng nhập, tài khoản active và có quyền action. `is_staff` không bắt buộc cho API này; giao diện quản lý nên là workspace người dùng, không dựa vào admin shell. `is_superuser` qua IAM; `is_novel` không ảnh hưởng.
- Quyền Short Links: `short_links.link.{read,create,update,delete,manage_all}`. Quyền Custom Pages: `custom_pages.page.{read,create,update,delete,manage_all}`. `manage_all` chỉ mở phạm vi owner; vẫn cần quyền action tương ứng. Người không có `manage_all` chỉ thấy tài nguyên của mình; truy cập id người khác trả 404.
- Mọi list hỗ trợ `page`/`page_size` (tối đa 100), `search`, `ordering` theo whitelist và filter mô tả dưới đây. Client không gửi `owner_id`, `created_by` hoặc audit field.
- Tạo mới có rate limit dùng PostgreSQL: mặc định 30 short links/giờ/user, 20 trang/giờ/user và 120 block/giờ/user. Backend trả 429 `RATE_LIMITED` khi vượt ngưỡng; ngưỡng có thể đổi qua biến môi trường.
- Slug dài 3–64 ký tự, chỉ `a-z`, `0-9`, dấu `-` nằm giữa các nhóm. Backend trim/lowercase, chặn `admin`, `api`, `login`, `register`, `system`, `settings`, `new`, `edit`, `create`; để trống field (không gửi) thì tự sinh. Unique không phân biệt hoa/thường trong từng module, kể cả tài nguyên đã xóa mềm. Đổi slug làm URL cũ trả 404; không có redirect cũ.
- Owner bị khóa không quản lý được nhưng tài nguyên công khai đã bật vẫn hoạt động. Khi module bị tắt, cả API quản lý và public trả 403 `MODULE_DISABLED`, không xóa dữ liệu.

## Short Links

### Màn hình và luồng

1. Danh sách link của tôi: tìm tên/slug/mô tả, lọc status và redirect type, sắp xếp, phân trang; empty state dẫn tới tạo link.
2. Form tạo/sửa: `name`, `destination_url`, `slug` tùy chọn, `description`, `redirect_type` 301/302, `status`, `expires_at` tùy chọn. 302 là mặc định. Khi chọn 301, hiển thị cảnh báo từ `redirect_warning` rằng trình duyệt/CDN có thể cache lâu và đổi đích không có hiệu lực ngay.
3. Chi tiết link: short URL để copy, URL đích, status cấu hình, `effective_status`, ngày hết hạn, ngày tạo/cập nhật; hành động bật/tắt, sửa, xóa có xác nhận.
4. Public `/s/{slug}`: frontend cần thêm rewrite trực tiếp tới backend `/api/v1/short_links/resolve/{slug}` để giữ HTTP 301/302 + Location; không dùng `apiClient` vì fetch tự theo redirect. Backend trả 404 khi inactive/đã xóa, 410 `SHORT_LINK_EXPIRED` khi hết hạn, 403 `MODULE_DISABLED` khi module tắt.

| Method | Endpoint | Quyền | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/short_links/links` | read | `?search=&status=ACTIVE\|INACTIVE&redirect_type=301\|302&ordering=-created_at&page=1&page_size=20` | list + pagination |
| POST | `/api/v1/short_links/links` | create | ShortLink input | detail, 201 |
| GET | `/api/v1/short_links/links/{id}` | read | — | detail |
| PATCH | `/api/v1/short_links/links/{id}` | update | subset input | detail |
| DELETE | `/api/v1/short_links/links/{id}` | delete | — | 204, no body |
| GET | `/api/v1/short_links/resolve/{slug}` | public | — | HTTP 301/302 + Location |

Input POST: `{ "name": "GitHub", "slug": "github", "destination_url": "https://github.com/example", "description": "", "redirect_type": 302, "status": "ACTIVE", "expires_at": null }`. POST bắt buộc `name`, `destination_url`; PATCH nhận tập con. `destination_url` tối đa 2048 ký tự, chỉ URL tuyệt đối HTTP/HTTPS, không credential/control character. Link nội bộ `/s/...` trên host của site bị từ chối để tránh chuỗi/vòng redirect. `expires_at` phải là tương lai khi nhập.

Detail response trong `data`: `id`, `owner_id`, `name`, `slug`, `destination_url`, `description`, `redirect_type`, `status`, `effective_status` (`ACTIVE`, `INACTIVE`, `EXPIRED`), `expires_at`, `short_url` (URL tuyệt đối), `redirect_warning` (string hoặc null), `created_at`, `updated_at`.

## Custom Pages

### Màn hình và luồng

1. Danh sách trang của tôi: tìm title/slug/mô tả, lọc `status=DRAFT|PUBLISHED|UNPUBLISHED`, sắp xếp và phân trang. Empty state dẫn tới tạo trang.
2. Form tạo/sửa trang: `title`, `slug` tùy chọn, `description`, `status`, `seo_title`, `seo_description`, `theme`, `avatar_id`, `cover_id`. Ảnh upload qua module Attachment hiện có trước khi gửi id; ảnh phải do chủ trang upload. `status` mặc định `DRAFT`.
3. Editor block: thêm cuối danh sách, sửa, ẩn/hiện, xóa, kéo sắp xếp bằng cách gửi **đủ toàn bộ** `block_ids` theo thứ tự mới. Giới hạn 50 block/trang. Page detail trả sẵn block theo `position`, gồm cả block ẩn.
4. Public `/p/{slug}`: frontend tạo route này, gọi `GET /api/v1/custom_pages/public/{slug}` và render block theo thứ tự. Draft/unpublished/đã xóa trả 404. Public data không có owner id, audit, block ẩn, attachment id. Dùng `canonical_url`, `seo_title`, `seo_description` cho metadata/OG.
5. QR nằm trong block `QR_CODE`: backend trả `qr_payload`; frontend dùng thư viện QR để vẽ PNG/SVG/canvas. `target_type=PAGE` dùng URL công khai hiện tại của trang (tự cập nhật khi đổi slug); `target_type=URL` dùng URL HTTP/HTTPS do chủ trang nhập. Không có API hay URL QR riêng.

| Method | Endpoint | Quyền | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/custom_pages/pages` | read | `?search=&status=&ordering=-created_at&page=1&page_size=20` | list + pagination |
| POST | `/api/v1/custom_pages/pages` | create | Page input | detail, 201 |
| GET | `/api/v1/custom_pages/pages/{id}` | read | — | detail + blocks |
| PATCH | `/api/v1/custom_pages/pages/{id}` | update | subset Page input | detail + blocks |
| DELETE | `/api/v1/custom_pages/pages/{id}` | delete | — | 204, no body |
| POST | `/api/v1/custom_pages/pages/{page_id}/blocks` | update | Block input | block, 201 |
| PATCH | `/api/v1/custom_pages/pages/{page_id}/blocks/{block_id}` | update | subset Block input | block |
| DELETE | `/api/v1/custom_pages/pages/{page_id}/blocks/{block_id}` | update | — | 204, no body |
| POST | `/api/v1/custom_pages/pages/{page_id}/blocks/reorder` | update | `{ "block_ids": ["uuid", ...] }` | toàn bộ block theo thứ tự mới |
| GET | `/api/v1/custom_pages/public/{slug}` | public | — | public page data |

Page input: `title` bắt buộc, tối đa 150 ký tự; `slug` tùy chọn; `description` tối đa 1000; `seo_title` tối đa 160; `seo_description` tối đa 300; `status` như trên; `avatar_id`/`cover_id` là UUID hoặc null; `theme` là object có thể gồm `mode` (`light|dark|system`), `primary_color`, `background_color`, `text_color` (màu `#RRGGBB`), `button_style` (`rounded|square|pill`). Khi nhập cả background và text color, độ tương phản tối thiểu 4.5:1.

Page detail: `id`, `owner_id`, `title`, `slug`, `description`, `status`, `public_url`, `seo_title`, `seo_description`, `theme`, `avatar_url`, `cover_url`, `blocks`, `created_at`, `updated_at`. Public data: `title`, `description`, `canonical_url`, `seo_title`, `seo_description`, `avatar_url`, `cover_url`, `theme`, `blocks`.

### Block contract

Block input: `{ "block_type": "TEXT", "content": { "text": "Xin chào" }, "is_visible": true }`. `position` do backend quản lý. PATCH nhận `block_type`, `content`, `is_visible` tùy chọn. Nếu đổi loại, gửi content phù hợp loại mới. Mọi text là plain text, không HTML/JS. Public block có `{block_type, content, position}`; riêng IMAGE đổi attachment id thành URL, QR_CODE đổi target thành payload.

| Loại | `content` quản lý | Public `content` | Giới hạn |
| --- | --- | --- | --- |
| `HEADING` | `{text, level: 1|2|3}` | như input | text ≤ 300 byte |
| `TEXT` | `{text}` | như input | text ≤ 5000 byte |
| `IMAGE` | `{attachment_id, alt}` | `{url, alt}` | ảnh thuộc owner, alt ≤ 200 byte |
| `BUTTON` | `{label, url}` | như input | label ≤ 120 byte, URL HTTP/HTTPS |
| `LINK_LIST` | `{items: [{label, url}]}` | như input | 1–20 mục |
| `SOCIAL_LINKS` | `{items: [{platform, url}]}` | như input | 1–12 mục |
| `DIVIDER` | `{}` | `{}` | — |
| `QR_CODE` | `{target_type: "PAGE", label}` hoặc `{target_type: "URL", target_url, label}` | `{label, qr_payload}` | URL HTTP/HTTPS |

Short Link có thể được dán như một URL vào BUTTON/LINK_LIST/QR_CODE, nhưng Custom Pages không tạo/sửa hay phụ thuộc bảng Short Links. Khi Short Links tắt, nút/QR đã dán URL `/s/...` có thể dẫn tới 403; editor nên cảnh báo người dùng nếu họ nhập URL nội bộ này.

## Lỗi và trạng thái giao diện

| HTTP/code | FE xử lý |
| --- | --- |
| 400 `VALIDATION_ERROR` | Hiện `error.details` theo field (slug, URL, content, theme, block_ids, expires_at). |
| 401 `AUTH_NOT_AUTHENTICATED` và các mã token | Dùng silent refresh hiện có; thất bại thì về login với `next`. |
| 403 `PERMISSION_DENIED` | Ẩn hành động theo quyền và hiện lỗi nếu quyền đổi trong lúc thao tác. |
| 403 `MODULE_DISABLED` | Hiện trạng thái module tạm dừng; không xóa local draft. |
| 404 `NOT_FOUND` | Tài nguyên không tồn tại, không thuộc mình, draft/unpublished hoặc đã xóa. Không suy đoán trường hợp nào từ API công khai. |
| 409 `CONFLICT` | Slug đã được dùng; giữ form data và yêu cầu slug khác. |
| 410 `SHORT_LINK_EXPIRED` | Trang thông báo link hết hạn. |
| 429 `RATE_LIMITED` | Hiện `Retry-After` nếu nhận được; không tự gửi liên tục. |

Loading state: skeleton cho list/detail; disable submit khi đang gửi; giữ form khi lỗi; optimistic reorder chỉ commit khi API thành công, rollback khi lỗi. Empty state riêng cho không có trang/link và không có kết quả lọc. i18n vi/en cần thêm namespace `shortLinks` và `customPages`, các nhãn field/status/block type, mô tả validation, cảnh báo 301, lỗi `SHORT_LINK_EXPIRED` và mọi trạng thái public. Các mã lỗi chung dùng message hiện có. `hasPermission`/`PermissionGate` chỉ hỗ trợ hiển thị; backend luôn kiểm tra.

## Trạng thái sẵn sàng

Backend API cho Short Links và Custom Pages đã có OpenAPI và integration tests. Frontend **chưa sẵn sàng** cho public URL cho tới khi thêm route `/p/[slug]`, rewrite `/s/:slug`, màn hình quản lý/editor và i18n. Không triển khai frontend trong phase này theo yêu cầu.
