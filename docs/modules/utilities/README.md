# Module Utilities (`utilities`)

Tiện ích: link rút gọn `/s/{slug}`, mã QR (VietQR, liên kết, văn bản; ảnh lưu vào Thư viện) và trang tùy chỉnh
`/<đường dẫn giữa>/<slug>` soạn bằng Tiptap (JSON). Phụ thuộc `system`.

- BE: `backend/app/utilities/` · FE: `frontend/src/modules/utilities/`
- URL quản trị: `/quan-tri/tien-ich/...` · nhóm `content`

## Model

`ShortLink` (lưu trữ `clicks_count` - tổng lượt truy cập, `visitors_count` - số người vào duy nhất, `last_accessed_at` - truy cập gần nhất), `QrCode`, `Page`, `PagePath` (đường dẫn giữa dùng chung cho nhiều trang), `DonationTransaction` (giao dịch quyên góp SePay gắn với trang Donate).

`Page` hỗ trợ hệ thống **Template-Based Website System** thông qua các trường:
- `page_type`: loại trang (`AFFILIATE`, `BIO`, `DONATION`, `PRODUCT_CATALOG`, `PORTFOLIO`, `LANDING`, `LEGACY_PAGE`).
- `template_key`: mã template giao diện (ví dụ `product_grid`, `product_list`, `minimal_links`, `vietqr_donate`).
- `template_version`: phiên bản template (mặc định 1).
- `content_config`: JSON dữ liệu chuyên biệt theo từng loại trang (sản phẩm, danh mục, liên kết, tài khoản ngân hàng, cấu hình webhook donate cho từng mã QR, ẩn hiện số tiền, số ngày vinh danh leaderboard).
- `style_config`: cấu hình giao diện (theme preset, màu sắc, bo góc, ẩn/hiện giá/ảnh).
- `responsive_config`: cấu hình hiển thị theo thiết bị (số cột trên desktop, tablet, mobile).
- `content`: Tiptap JSON giữ lại cho các trang kiểu tự do (`LEGACY_PAGE`, ẩn tab **Giao diện** trong form để chỉ nhập nội dung văn bản và đồng bộ 100% bảng màu với Editor ở Preview/trang công khai); node `image` hỗ trợ kích thước (`width` % / px) và căn lề (`align`: `left`, `center`, `right`, `full`) cho cả ảnh Thư viện và URL ngoài (`page_content_validator.py`).
- Demo công khai `/demo/[type]` (`affiliate`, `bio`, `donation`) và trình diễn trọn bộ 3 Preset Editor dùng chung tại `/demo/editor` (`NotionDemoView` gồm `TiptapEditor` bản Full hợp nhất Simple Sticky Toolbar + Notion-like kéo thả dòng `⠿` / `/` / Bubble Toolbar, `TiptapBasicEditor` cho mô tả và `TiptapCommentEditor` cho bình luận).

## Quyền

| Class | Tài nguyên | `MEMBER` |
| --- | --- | --- |
| `ShortLinkPermission` | `short_link` (+ `manage_all`) | read, create, update, delete |
| `QrCodePermission` | `qr_code` (+ `manage_all`) | read, create, update, delete |
| `PagePermission` | `page` (+ `manage_all`) | read, create, update, delete |
| `PagePathPermission` | `page_path` | read |
| `DonationPermission` | `donation` (+ `manage_all`, `export`) | read, update, export |

## Màn quản trị

Chia 3 cụm chuẩn:
- **Tổng quan (`overview`)**: Tổng quan module Tiện ích (`/quan-tri/tien-ich`) - Dashboard trung tâm tích hợp 4 tab theo dõi toàn bộ lưu lượng toàn sàn: Tổng quan KPI, Quyên góp & SePay, Link rút gọn & QR, Trang tùy chỉnh.
- **Nội dung (`content`)**: Trang (`trang`) · Đường dẫn (`duong-dan`) · Quyên góp (`quyen-gop` - Lịch sử ủng hộ toàn sàn, lọc bảng vinh danh, trạng thái kiểm duyệt, xuất báo cáo CSV).
- **Công cụ (`tools`)**: Link rút gọn (`link-rut-gon`) · Mã QR (`ma-qr`).

Ngoài ra, phần thống kê Quyên góp được gộp trực tiếp vào Dashboard hợp nhất (`/ca-nhan`), còn màn hình **Giao dịch ủng hộ** (`/ca-nhan/quyen-gop`) nằm trong cụm Tiện ích dành cho chủ trang lọc theo ngày, ẩn/hiện bình luận và xuất báo cáo CSV. Webhook mỗi mã QR (`DonationTransactionService._sync_to_finance_income`) tự động áp vào module `finance` dưới nền tảng `Donate` (`code="donate"`), ghi đủ thông tin ngân hàng/mã tham chiếu và phát thông báo `finance.income.received` trỏ về `/portal/finance/incomes/{id}`.

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
- `/<đường dẫn>/<slug>`: trang tùy chỉnh công khai.
  - Tự động điều hướng hiển thị (`PageRendererDispatcher`): trang Affiliate Storefront, Bio Link, Donation VietQR hoặc Legacy Tiptap.
  - **Trang Donate SePay**:
    + Bảng Vinh danh phân hạng 4 cấp (Đồng ≥100k, Bạc ≥200k, Vàng ≥500k, Kim Cương ≥1M) với đồng hồ đếm ngược trực tiếp (Live Countdown) theo số ngày cấu hình.
    + Danh sách Ủng hộ gần đây (`list_public_feed`) và Bảng Vinh danh (`list_public_leaderboard`) được cache Redis `600 giây` (Leaderboard tự cắt TTL không vượt quá thời điểm `tier_expires_at` gần nhất) trong namespace `utilities:public`, tự vô hiệu hóa cache khi webhook SePay tạo giao dịch hoặc quản trị viên sửa/duyệt/xóa giao dịch; FE chỉ polling tab đang xem khi trang hiển thị (`60 giây` cho Feed, `120 giây` cho Leaderboard, `refetchIntervalInBackground: false`), bỏ thanh ticker chạy ngang.
    + Quy đổi quà tặng hóm hỉnh (ly cà phê, gói mì tôm, bữa sáng, cuốn sách, nồi lẩu...).
    + Switch ẩn/hiện số tiền cho từng mã QR (giữ bí mật số tiền khi cần thiết).
    + Bộ lọc Regex tự động kiểm duyệt các từ ngữ bạo lực, khủng bố, chửi thề tục tĩu (cả teencode), tự động thay thế bằng lời cảm ơn an toàn trên trang public và cảnh báo đỏ trên dashboard.
    + Thống kê Dashboard quyên góp (`GET /api/v1/utilities/donations/stats`): tổng tiền, lượt ủng hộ, kiểm duyệt, bình luận ẩn, cơ cấu quà tặng `by_gift` và biến động theo ngày `daily_trend` phục vụ biểu đồ trực quan phía client/portal.
  - Ảnh động từ R2/CDN ngoài trong trang và bảng QR (`qr-code-table`, `qr-code-picker`, `DestinationFavicon`) dùng `<Image unoptimized />` để không tiêu tốn hạn mức Next.js Image Optimization.
- `POST /api/v1/utilities/pages/fetch-metadata`: trích xuất metadata sản phẩm/liên kết từ URL (OpenGraph, Twitter Card, JSON-LD, platform detector) phục vụ chức năng Quick Add trong quản trị. Được bảo vệ bởi bộ lọc an toàn 7 lớp chống SSRF (`SafeHttpClient` từ `app/core/utils/safe_http_client.py`) và cache Redis 7 ngày.
- Cache Redis (`constants/public_cache.py`, namespace `utilities:public`): link công khai và trang **đã xuất bản**
  được cache 10 phút (slug không tồn tại: 60 giây), nên lượt khách lặp lại không chạm Neon. `ShortLinkService`,
  `PageService`, `PagePathService`, `QrCodeService` khai `public_cache_namespace`: mọi ghi tăng version sau commit
  nên cache cũ hết hiệu lực ngay. Link có mật khẩu chỉ cache cờ "có khóa" (không mã băm, không URL đích); mở khóa
  luôn kiểm ở DB. Bản nháp không bao giờ cache. Không có `REDIS_URL` thì đọc DB như cũ.

## Sự kiện, webhook, callback

- Webhook SePay theo mã QR: `POST /api/v1/utilities/donations/webhook/{webhook_token}` (khai báo `WebhookDefinition` trong `ModuleDescriptor`). Bất kỳ người dùng nào (kể cả không có quyền `is_staff`) đều cấu hình được trực tiếp khi tạo mã QR donate.

## Chức năng liên quan

[File công khai và riêng tư](../../features/attachment-visibility.md) (logo QR, ảnh trong trang phải công khai).
