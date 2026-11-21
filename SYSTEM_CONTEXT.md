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
  mỗi module hai vai trò `<MÃ_MODULE>_MANAGER` (mọi quyền của module) và `<MÃ_MODULE>_VIEWER` (chỉ quyền `read`).
  Không khai vai trò nghiệp vụ tự đặt; quản trị viên tự tạo khi cần.
- Module **System** (`system`, BE `app/system`, FE `modules/system`, API `/api/v1/system/...`, bảng `system_*`)
  gộp phần nền: tài khoản (`AUTH_USER_MODEL = system.User`), IAM (vai trò/quyền), đăng nhập/phiên, thư viện
  file, lịch sử thay đổi (Journal) và health. Module nghiệp vụ (`novel`, `utilities`) chỉ phụ thuộc `system`.
- File (kể cả ảnh đại diện) lưu qua Thư viện của module `system`; `User.avatar` là FK tới `Attachment`.
  SVG chỉ nhận khi an toàn (không script/sự kiện/liên kết ngoài, không DTD).
- Thư viện ở Hệ thống → Thư viện (`/vi/quan-tri/thu-vien`): mặc định API chỉ trả file do actor upload;
  quyền `system.attachment.manage_all` mở phạm vi sang mọi người, vẫn cần quyền action tương ứng.
  Người thường có quyền IAM cũng dùng được API; menu quản trị giữ yêu cầu staff.
  Mọi upload tệp chỉ thực hiện ở trang Thư viện. Avatar, logo QR và editor chọn ảnh đã có trong
  Thư viện; bộ chọn không có tab upload. Xóa mềm sau xác nhận, nơi đang dùng không còn hiện ảnh;
  URL file vẫn truy cập trực tiếp được và file vật lý giữ lại theo chính sách dọn storage.
  Thư mục logic nhiều cấp dùng `parent` và danh sách tổ tiên; đổi tên/chuyển nhánh không đổi
  đường dẫn `attachments/YYYY/MM/<uuid>.<ext>`. Lọc thư mục bao gồm file trong toàn bộ nhánh.
  Xóa thư mục có hai lựa chọn: giữ file về Chưa phân loại hoặc xóa mềm cả file trong nhánh
  (cần thêm `system.attachment.delete`). Quyền `system.attachment_folder.{read,create,update,delete}`
  độc lập với file; `system.attachment.update` cho chuyển file giữa các thư mục cùng chủ sở hữu.
  Hỗ trợ ảnh PNG/JPEG/WebP/GIF/SVG an toàn, video MP4/MOV/WebM và PDF; xác định bằng chữ ký,
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
- Báo lỗi: Sentry ở BE khi có `SENTRY_DSN`; lỗi trình duyệt gửi về BE.
- Soạn thảo dùng Tiptap JSON (`TiptapEditor` / `TiptapContent`); không lưu HTML tùy ý.
- Module **Tiện ích** (`utilities`, BE `app/utilities`, FE `modules/utilities`, API `/api/v1/utilities/...`) gộp
  link rút gọn, mã QR và trang tùy chỉnh (bảng `utilities_*`). Mã QR: URL/văn bản/VietQR, PNG lưu ở Attachment. Payload chuyển khoản dùng `napas-qr-python` (gồm CRC); ảnh PNG/SVG dùng `segno`. Logo tùy chọn lấy từ ảnh raster trong
  Thư viện, ghép bằng Pillow với mức sửa lỗi H. Chèn QR vào
  editor là chèn ảnh PNG của mã đó. Link rút gọn `/s/{slug}`; trang tự tạo `/{đường dẫn}/{slug}` (đường dẫn
  quản lý ở `utilities.page_path`, `p` và `qr` có sẵn), bản nháp xem trước bằng `?preview=1` khi có quyền.
- Link rút gọn `/s/{slug}` mở trang trung gian HTTP 200: chờ người xem bấm hoặc tự mở đích sau 1–60 giây.
  Có thể đặt mật khẩu và thời điểm hết hạn; link hết hạn hiện trang thông báo. Slug tự sinh là UUID.
  Mật khẩu được băm, không trả mã băm hay URL đích của link khóa ở API công khai.
- Nhóm Hệ thống ở FE có một module `system` với menu: Người dùng, Phiên, Vai trò, Quyền, Thư viện, Nhật ký.
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
