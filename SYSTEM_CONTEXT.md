# SYSTEM_CONTEXT — TOANNX

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
| Bố cục backend | Mỗi class một file: `models/`, `repositories/` (lớp DB duy nhất), `services/` theo model; `serializers/validates` + `serializers/responses` theo endpoint; `views/` theo resource (`XxxView` + `XxxObjectView`, kiểu PMS). |
| Nguồn sự thật về quyền | Bảng IAM (`iam_role`, `iam_permission`, `iam_user_role`, `iam_role_permission`). User **không** dùng `PermissionsMixin`/groups của Django. |
| Token | Access JWT HS256 10 phút gắn `sid` (phiên); refresh token ngẫu nhiên 384-bit, chỉ lưu HMAC-SHA256, xoay vòng mỗi lần dùng, phát hiện tái sử dụng. |
| Thu hồi | Mỗi request kiểm tra phiên còn hiệu lực → logout/logout-all/khóa tài khoản/đổi mật khẩu có hiệu lực ngay. |
| CSRF | CSRF của Django (cookie `csrftoken` + header `X-CSRFToken` + kiểm tra Origin) cho mọi request đổi trạng thái dùng cookie. |
| Rate limit | PostgreSQL (`auth_rate_limit_bucket`, upsert nguyên tử). Không dùng bộ nhớ (Vercel không giữ state). |
| Superuser | Bỏ qua kiểm tra quyền ở tầng ứng dụng, không bỏ qua đăng nhập. Không thể vô hiệu/hạ quyền superuser hoạt động cuối cùng. |
| `is_staff` | Chỉ cho vào khu vực quản trị; từng API vẫn kiểm tra quyền. |
| `is_novel` | Chỉ là cờ đánh dấu nhóm nghiệp vụ Novel; **không** cấp quyền nào. |
| Module | Có trong `INSTALLED_APPS` + đăng ký descriptor là hoạt động (không bật/tắt runtime, không bảng cấu hình); quyền = IAM; nhóm/icon hiển thị khai tĩnh ở FE (`manage-app`). |
| Đăng ký | Không có. User do superuser/admin có quyền tạo, hoặc `createsuperuser`. |
| i18n | `vi` mặc định, `en`; URL dịch (`/vi/quan-tri` ↔ `/en/admin`). API trả mã lỗi ổn định, FE dịch theo mã. |

## Tài khoản & dữ liệu

- Vai trò hệ thống seed bằng data migration: `ADMIN` (`auto_grant=all`), `VIEWER` (`auto_grant=read_only`).
- Tài khoản (`AUTH_USER_MODEL = account.User`) thuộc module `account`; IAM (vai trò/quyền) phụ thuộc account.
- File (kể cả ảnh đại diện) lưu qua module `attachment`; `User.avatar` là FK tới `Attachment`.
  SVG chỉ nhận khi an toàn (không script/sự kiện/liên kết ngoài, không DTD).
- Thư viện ở Hệ thống → Thư viện (`/vi/quan-tri/thu-vien`): mặc định API chỉ trả file do actor upload;
  quyền `attachment.file.manage_all` mở phạm vi sang mọi người, vẫn cần quyền action tương ứng.
  Người thường có quyền IAM cũng dùng được API; menu quản trị giữ yêu cầu staff.
  Avatar có thể chọn ảnh đã có hoặc upload. Xóa mềm sau xác nhận, nơi đang dùng không còn hiện ảnh;
  URL file vẫn truy cập trực tiếp được và file vật lý giữ lại theo chính sách dọn storage.
  Thư mục logic nhiều cấp dùng `parent` và danh sách tổ tiên; đổi tên/chuyển nhánh không đổi
  đường dẫn `attachments/YYYY/MM/<uuid>.<ext>`. Lọc thư mục bao gồm file trong toàn bộ nhánh.
  Xóa thư mục có hai lựa chọn: giữ file về Chưa phân loại hoặc xóa mềm cả file trong nhánh
  (cần thêm `attachment.file.delete`). Quyền `attachment.folder.{read,create,update,delete}`
  độc lập với file; `attachment.file.update` cho chuyển file giữa các thư mục cùng chủ sở hữu.
  Hỗ trợ ảnh PNG/JPEG/WebP/GIF/SVG an toàn, video MP4/MOV/WebM và PDF; xác định bằng chữ ký,
  giới hạn dung lượng vẫn theo cấu hình hiện tại. Dialog avatar có lọc loại/đuôi và chỉ xác nhận ảnh.
- URL file trả về là **URL tuyệt đối** theo domain của request (`X-Forwarded-Host/Proto` sau proxy);
  frontend dùng trực tiếp, không nối domain.
- Quyền hiện có: `account.user.{read,create,update,delete}`, `iam.role.{read,create,update,delete,assign}`,
  `authentication.session.{read,revoke}` (quản trị phiên của mọi người dùng),
  `iam.permission.{read,assign}`, `attachment.file.{read,create,delete}`,
  `short_links.link.{read,create,update,delete,manage_all}` và `custom_pages.page.{read,create,update,delete,manage_all}`.
  Catalog quyền của từng module đặt tại `app/modules/<module>/permissions/<module>_permission.py`.
- Nhóm Hệ thống ở FE chia **Tài khoản: Người dùng, Phiên** và **Phân quyền: Vai trò, Quyền**.
  Quyền là danh mục chỉ đọc nhóm theo module. Tìm kiếm chỉ áp dụng khi Enter; bộ lọc, sắp xếp và
  phân trang đồng bộ URL. Người dùng lọc vai trò/trạng thái; Vai trò lọc trạng thái/loại/chính sách tự cấp.
  Phiên lọc nhiều người dùng kết hợp trạng thái; danh mục chủ phiên phân trang qua
  `/auth/admin-sessions/users`, dùng quyền `authentication.session.read`, không yêu cầu đọc tài khoản.

## Lệnh quan trọng

| Lệnh | Mục đích |
| --- | --- |
| `uv run python manage.py migrate` | Migration + đồng bộ quyền (post_migrate) |
| `uv run python manage.py sync_iam` | Đồng bộ lại quyền/vai trò hệ thống |
| `uv run python manage.py createsuperuser` | Tạo superuser (cũng là cách khôi phục quyền quản trị) |
| `./scripts/check-all.sh` | Toàn bộ kiểm tra |
