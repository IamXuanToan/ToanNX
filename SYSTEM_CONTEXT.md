# SYSTEM_CONTEXT — ToanNX

Tài liệu ngắn để người/agent mới nắm hệ thống trong 5 phút. Chi tiết nằm trong `docs/`.

## Topology

```
Trình duyệt ──► toannx.com (Next.js, Vercel)
                 ├─ proxy.ts: định tuyến vi/en + kiểm tra lạc quan cookie `session_hint`
                 └─ rewrite /api/v1/*  ──►  api.toannx.com (Django, Vercel Python) ──► Neon PostgreSQL
```

Trình duyệt chỉ nói chuyện với **một origin** (`toannx.com`). Cookie phiên là cookie host-only của
`toannx.com`; không phụ thuộc cookie cross-domain và không cần CORS ở production.

## Quyết định đã chốt

| Chủ đề | Quyết định |
| --- | --- |
| Settings Django | Một file `backend/config/settings.py`; khác biệt môi trường chỉ qua biến môi trường (`DJANGO_DEBUG`...). |
| Scaffold | Tạo bằng CLI chính thức: `uv init`, `django-admin startproject config .`, `manage.py startapp`, `create-next-app`, `shadcn init/add`. |
| Bố cục backend | Mỗi class một file: `models/`, `repositories/` (lớp DB duy nhất), `services/` theo model; `serializers/validates` + `serializers/responses` theo endpoint; `views/` theo resource (`XxxView` + `XxxObjectView` chung một file, ngoại lệ duy nhất của luật một class một file, kiểu PMS). Frontend: mỗi component một file, mỗi hook một file (xem `docs/rules/frontend.md` §2.1). |
| Nguồn sự thật về quyền | Bảng IAM (`system_role`, `system_permission`, `system_user_role`, `system_role_permission`). User **không** dùng `PermissionsMixin`/groups của Django. |
| Token | Access JWT HS256 10 phút gắn `sid` (phiên); refresh token ngẫu nhiên 384-bit, chỉ lưu HMAC-SHA256, xoay vòng mỗi lần dùng, phát hiện tái sử dụng. |
| Thu hồi | Mỗi request kiểm tra phiên còn hiệu lực → logout/logout-all/khóa tài khoản/đổi mật khẩu có hiệu lực ngay. |
| CSRF | CSRF của Django (cookie `csrftoken` + header `X-CSRFToken` + kiểm tra Origin) cho mọi request đổi trạng thái dùng cookie. |
| Rate limit | PostgreSQL (`system_rate_limit_bucket`, upsert nguyên tử). Không dùng bộ nhớ (Vercel không giữ state). |
| Superuser | Bỏ qua kiểm tra quyền ở tầng ứng dụng, không bỏ qua đăng nhập. Không thể vô hiệu/hạ quyền superuser hoạt động cuối cùng. |
| `is_staff` | Chỉ quyết định FE hiển thị khung quản trị; API **không** kiểm cờ này, chỉ kiểm quyền IAM. |
| `is_novel` | Chỉ là cờ đánh dấu nhóm nghiệp vụ Novel; **không** cấp quyền nào. |
| Module | Có trong `INSTALLED_APPS` + đăng ký descriptor là hoạt động (không bật/tắt runtime, không bảng cấu hình); quyền = IAM; nhóm/icon hiển thị khai tĩnh ở FE (`manage-app`). |
| Đăng ký | Không có. User do superuser/admin có quyền tạo, hoặc `createsuperuser`. |
| Thương hiệu | Xanh lá theo logo cỏ bốn lá: `--primary` `#3D812E`, hover `#206A2D`, focus `#569533`; logo/favicon sinh từ `frontend/public/brand/logo.png` bằng `scripts/build_brand_assets.py` (rule frontend §4.0). |
| i18n | `vi` mặc định, `en`; URL dịch (`/vi/quan-tri` ↔ `/en/admin`). API trả mã lỗi ổn định, FE dịch theo mã. |

## Tài khoản & dữ liệu

- Vai trò mẫu (`RoleSeedService`, khai ở `system/constants/predefined_roles.py`): `ADMIN` là vai trò hệ thống duy
  nhất (`auto_grant=all`), tạo sau mỗi `migrate` (post_migrate), không dùng data migration; `seed_roles` tạo thêm
  mỗi module ba vai trò `<MÃ_MODULE>_MANAGER` (mọi quyền của module), `<MÃ_MODULE>_VIEWER` (chỉ quyền `read`) và
  `<MÃ_MODULE>_MEMBER` (bản ghi do mình tạo, quyền từ `MEMBER` của từng class quyền, gom ở `member_permissions` bắt buộc khai).
  Không khai vai trò nghiệp vụ tự đặt; quản trị viên tự tạo khi cần.
- Module **System** (`system`, BE `app/system`, FE `modules/system`, API `/api/v1/system/...`, bảng `system_*`)
  gộp phần nền: tài khoản (`AUTH_USER_MODEL = system.User`), IAM (vai trò/quyền), đăng nhập/phiên, thư viện
  file, lịch sử thay đổi (Journal) và health. Module nghiệp vụ (`novel`, `utilities`, `finance`) chỉ phụ thuộc `system`.
- File (kể cả ảnh đại diện) lưu qua Thư viện của module `system`; `User.avatar` là FK tới `Attachment`.
  SVG chỉ nhận khi an toàn (không script/sự kiện/liên kết ngoài, không DTD).
- Thư viện ở Hệ thống → Thư viện (`/vi/quan-tri/he-thong/thu-vien`): mặc định API chỉ trả file do actor upload;
  quyền `system.attachment.manage_all` mở phạm vi sang mọi người, vẫn cần quyền action tương ứng.
  Người thường có quyền IAM cũng dùng được API; menu quản trị giữ yêu cầu staff.
  Upload ở trang Thư viện hoặc ngay trong bộ chọn dùng chung `AttachmentPicker` (kéo thả khi nơi dùng
  cho `canUpload`); nơi dùng chỉ khai props (loại file, chế độ xem), không tự viết bộ upload. Xóa mềm
  sau xác nhận, nơi đang dùng không còn hiện ảnh; file vật lý giữ lại theo chính sách dọn storage.
- File có chế độ xem `public` (mặc định) hoặc `private`. File công khai: URL trực tiếp của storage, ai có
  link đều xem. File riêng tư nằm ở kho riêng (`STORAGES["private"]`: bucket R2
  `CLOUDFLARE_R2_PRIVATE_BUCKET_NAME` không bật public access; local là `PRIVATE_MEDIA_ROOT`), `url` là
  `/api/v1/system/attachments/{id}/content` — chỉ người upload, superuser hoặc
  `system.attachment.read_private` mở được (302 tới link ký 5 phút; không quyền và không tồn tại cùng 404).
  Link chia sẻ của file riêng tư là trang `/vi/tep/{id}`. Chuyển chế độ: `POST /attachments/{id}/visibility`
  (chép sang kho kia, cập nhật, xóa bản cũ sau commit). Ảnh đại diện, logo QR, ảnh trong trang công khai
  phải là ảnh công khai (bộ chọn mặc định chỉ liệt kê file công khai). CSV/XLSX/XML (chứng từ) mặc định
  riêng tư và luôn tải về, không hiển thị trong trình duyệt.
  Thư mục logic nhiều cấp dùng `parent` và danh sách tổ tiên; đổi tên/chuyển nhánh không đổi
  đường dẫn `attachments/YYYY/MM/<uuid>.<ext>`. Lọc thư mục bao gồm file trong toàn bộ nhánh.
  Xóa thư mục có hai lựa chọn: giữ file về Chưa phân loại hoặc xóa mềm cả file trong nhánh
  (cần thêm `system.attachment.delete`). Quyền `system.attachment_folder.{read,create,update,delete}`
  độc lập với file; `system.attachment.update` cho chuyển file giữa các thư mục cùng chủ sở hữu.
  Hỗ trợ ảnh PNG/JPEG/WebP/GIF/SVG an toàn, video MP4/MOV/WebM, PDF, XLSX, CSV (UTF-8) và XML (không
  DTD/entity); xác định bằng nội dung,
  giới hạn dung lượng vẫn theo cấu hình hiện tại. Dialog avatar có lọc loại/đuôi và chỉ xác nhận ảnh.
- URL file trả về là **URL tuyệt đối** theo domain của request (`X-Forwarded-Host/Proto` sau proxy);
  frontend dùng trực tiếp, không nối domain.
- Quyền hiện có: `system.user.{read,create,update,delete}`, `system.role.{read,create,update,delete,assign}`,
  `system.permission.{read,assign}`, `system.session.{read,revoke,delete}` (quản trị phiên mọi người dùng),
  `system.attachment.{read,create,update,delete,manage_all}`, `system.attachment_folder.{read,create,update,delete}`,
  `system.journal_entry.read`, `utilities.short_link.{read,create,update,delete,manage_all}`,
  `utilities.qr_code.{read,create,update,delete,manage_all}`, `utilities.page_path.{read,create,update,delete}` và
  `utilities.page.{read,create,update,delete,manage_all}`.
  Catalog quyền đặt theo model: `app/<module>/permissions/<model>_permission.py` (mỗi model một file).
- Base chuẩn: BE chỉ có `CoreApiView`, `CoreModelViewSet`, `CoreCrudService`, `CoreRepository`; khác thì ghi đè
  thuộc tính trong view/service (xem `AGENTS.md`). Danh sách chỉ phân trang khi gửi `page`/`page_size`.
- Lịch sử thay đổi: model kế thừa `JournalTracker` tự ghi Journal khi CRUD (cùng transaction); trang Journal lọc
  theo `module.model`, trang chi tiết có thẻ lịch sử. Giữ `JOURNAL_RETENTION_DAYS` ngày, dọn bằng `run_cleanup`.
- Journal có trang chi tiết từng thay đổi: field nào, giá trị cũ → mới (danh sách tô phần thêm/bỏ, JSON dàn
  trang), request id để đối chiếu log.
- File vật lý: tệp đã xóa mềm và file mồ côi bị dọn sau `ATTACHMENT_PURGE_DAYS` ngày (giữ dòng dữ liệu).
- Báo lỗi: Ghi log ở BE; lỗi trình duyệt gửi về BE.
- Soạn thảo dùng Tiptap JSON (`TiptapEditor` / `TiptapContent`); không lưu HTML tùy ý.
- Module **Tiện ích** (`utilities`, BE `app/utilities`, FE `modules/utilities`, API `/api/v1/utilities/...`) gộp
  link rút gọn, mã QR và trang tùy chỉnh (bảng `utilities_*`). Mã QR: URL/văn bản/VietQR, PNG lưu ở Attachment. Payload chuyển khoản dùng `napas-qr-python` (gồm CRC); ảnh PNG/SVG dùng `segno`. Logo tùy chọn lấy từ ảnh raster trong
  Thư viện, ghép bằng Pillow với mức sửa lỗi H. Chèn QR vào
  editor là chèn ảnh PNG của mã đó. Link rút gọn `/s/{slug}`; trang tự tạo `/{đường dẫn}/{slug}` (đường dẫn
  quản lý ở `utilities.page_path`, `p` và `qr` có sẵn), bản nháp xem trước bằng `?preview=1` khi có quyền.
- Link rút gọn `/s/{slug}` mở trang trung gian HTTP 200: chờ người xem bấm hoặc tự mở đích sau 1–60 giây.
  Có thể đặt mật khẩu và thời điểm hết hạn; link hết hạn hiện trang thông báo. Slug tự sinh là UUID.
  Mật khẩu được băm, không trả mã băm hay URL đích của link khóa ở API công khai.
- Module **Tài chính** (`finance`, BE `app/finance`, FE `modules/finance`, API `/api/v1/finance/...`, bảng
  `finance_*`, nhóm quản trị "Tài chính"; thiết kế: `docs/plans/2026/11/21/finance-refactor-plan.md`). Chỉ theo dõi **thu nhập
  (tiền vào)** của từng người: model `Platform` + `PlatformTaxRate` (lịch sử % khấu trừ theo `effective_from`),
  `ClassificationRule` (regex → nền tảng, thư viện `regex` có timeout), `Income` (nhập tay hoặc SePay; chụp lại
  `tax_rate`/`tax_amount`, sửa được; T = round(N × r / (100 − r)), G = N + T; ngoại tệ quy về VNĐ theo tỷ giá
  `system`), `Invoice` (hóa đơn/chứng từ, file riêng tư, gắn nhiều khoản thu). Báo cáo năm/tháng giờ VN: tổng, đã
  khấu trừ (kèm tiền thuế), chưa khấu trừ — **không tính thuế phải nộp**. Không có tài khoản ngân hàng, kênh, loại
  dòng tiền. SePay theo từng người (`SepayConnection`: token mã hóa bằng `SecretCipher`, webhook
  `POST /api/v1/finance/sepay/webhook/{public_id}`, secret dẫn xuất `salted_hmac`, HMAC-SHA256 trên
  `{timestamp}.{body}` ±300 giây; trả đúng `{"success": true}`). Lấy thủ công có màn xem trước tích chọn
  (NEW/EXISTS/CHANGED), không ghi đè khoản đã có nếu không chọn. Webhook không có tiền tệ: luôn VNĐ; không đọc được
  số tiền → `amount_status` cần xem lại.
- Tiền tệ và tỷ giá ở `system` (`Currency` seed VND gốc + USD; `ExchangeRate` nhập tay hoặc Vietcombank, quy về VNĐ).
- Thông báo dùng chung (module `system`, thiết kế `docs/plans/2026/11/22/notification-system-plan.md`): module khai sự kiện
  trong `ModuleDescriptor.notification_events` (`scope` PERSONAL/SYSTEM, `audience` OWNER/SUBSCRIBERS,
  `permission`, mức INFO/WARNING/ERROR) và gọi `NotificationService.notify(...)`; model `Notification` (chuông 2 tab
  Cá nhân / Hệ thống) + outbox `NotificationDelivery` theo kênh (Trình duyệt qua FCM, Email, Telegram); gửi ngay
  sau commit trong ngân sách thời gian, phần còn lại và thử lại (tối đa 5 lần) do cron-job.org gọi
  `POST /api/v1/system/notifications/dispatch` (`CRON_SECRET`). Không WebSocket: realtime nhờ FCM + polling 60 giây.
  Cả hệ thống dùng **một Bot Telegram chung** cấu hình qua ENV (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` hiển
  thị cho người dùng khi liên kết); nơi nhận (chat/nhóm/kênh) do từng người dùng tự cấu hình (`TelegramChat`). Nhật ký gửi:
  `/vi/quan-tri/he-thong/nhat-ky-thong-bao`.
- Module **Không gian cá nhân** (`workspace`, BE `app/workspace`, FE trên Client Portal `/ca-nhan/...`, API
  `/api/v1/workspace/...`, bảng `workspace_*`, thiết kế `docs/plans/2026/11/25/personal-assistant-plan.md`):
  quản lý Thiết bị & Bảo hành, Gói định kỳ & Gia hạn, Két sắt bí mật (`SecretCipher`), Giám sát Uptime, Nhắc việc,
  Lịch vạn niên/Âm lịch và Trợ lý AI (`xKiro`, API key ở ENV, danh sách model **fallback tuần tự** khi chạm hạn mức
  hoặc lỗi, kèm cấu hình nhóm Telegram & lịch hiển thị theo từng người). Tài nguyên có owner theo chuẩn IAM:
  `ADMIN` (`manage_all`) toàn quyền xem/sửa/xóa trên dữ liệu của mọi người dùng.
- Nhóm Hệ thống ở FE có một module `system` với menu: Người dùng, Phiên, Vai trò, Quyền, Thư viện, Cài đặt,
  Nhật ký thông báo, Gửi thông báo, Tiền tệ, Tỷ giá, Webhook (webhook các module khai, URL theo domain backend), Callback (URL OAuth Google/GitHub theo
  domain FE), Nhật ký. URL quản trị có tiền tố module: `/quan-tri/he-thong/...`, `/quan-tri/tien-ich/...`,
  `/quan-tri/truyen/...`, `/quan-tri/tai-chinh/...`.
  Quyền là danh mục chỉ đọc nhóm theo module. Tìm kiếm chỉ áp dụng khi Enter; bộ lọc, sắp xếp và
  phân trang đồng bộ URL. Người dùng lọc vai trò/trạng thái; Vai trò lọc trạng thái/loại/chính sách tự cấp.
  Phiên lọc nhiều người dùng kết hợp trạng thái; danh mục chủ phiên phân trang qua
  `/system/auth/admin-sessions/users`, dùng quyền `system.session.read`, không yêu cầu đọc tài khoản.

## Lệnh quan trọng

| Lệnh | Mục đích |
| --- | --- |
| `uv run python manage.py migrate` | Migration + đồng bộ quyền (post_migrate) |
| `uv run python manage.py sync_iam` | Đồng bộ lại quyền/vai trò hệ thống |
| `uv run python manage.py seed_local` | Chỉ local (`DEBUG=True`): đồng bộ quyền + superuser `toannx` / `nxtoan2k4@gmail.com`, chạy lại được |
| `uv run python manage.py createsuperuser` | Tạo superuser (cũng là cách khôi phục quyền quản trị) |
| `./scripts/check-all.sh` | Toàn bộ kiểm tra |
