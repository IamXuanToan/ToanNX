# SYSTEM_CONTEXT — TOANNX

Tài liệu ngắn để người/agent mới nắm hệ thống trong 5 phút. Chi tiết nằm trong `docs/`.

## Topology

```
Trình duyệt ──► toannx.com (Next.js, Vercel)
                 ├─ proxy.ts: định tuyến vi/en + kiểm tra lạc quan cookie `toannx_session`
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
| CSRF | CSRF của Django (cookie `toannx_csrf` + header `X-CSRFToken` + kiểm tra Origin) cho mọi request đổi trạng thái dùng cookie. |
| Rate limit | PostgreSQL (`auth_rate_limit_bucket`, upsert nguyên tử). Không dùng bộ nhớ (Vercel không giữ state). |
| Superuser | Bỏ qua kiểm tra quyền ở tầng ứng dụng, không bỏ qua đăng nhập. Không thể vô hiệu/hạ quyền superuser hoạt động cuối cùng. |
| `is_staff` | Chỉ cho vào khu vực quản trị; từng API vẫn kiểm tra quyền. |
| `is_novel` | Chỉ là cờ đánh dấu nhóm nghiệp vụ Novel; **không** cấp quyền nào. |
| Module | Installed = có trong `INSTALLED_APPS` + đăng ký descriptor; Enabled = cờ runtime trong `system_module`; quyền = IAM. |
| Đăng ký | Không có. User do superuser/admin có quyền tạo, hoặc `createsuperuser`. |
| i18n | `vi` mặc định, `en`; URL dịch (`/vi/quan-tri` ↔ `/en/admin`). API trả mã lỗi ổn định, FE dịch theo mã. |

## Tài khoản & dữ liệu

- Vai trò hệ thống seed bằng data migration: `ADMIN` (`auto_grant=all`), `VIEWER` (`auto_grant=read_only`).
- Tài khoản (`AUTH_USER_MODEL = account.User`) thuộc module `account`; IAM (vai trò/quyền) phụ thuộc account.
- File (kể cả ảnh đại diện, icon SVG) lưu qua module `attachment`; `User.avatar` là FK tới `Attachment`.
  SVG chỉ nhận khi an toàn (không script/sự kiện/liên kết ngoài, không DTD).
- URL file trả về là **URL tuyệt đối** theo domain của request (`X-Forwarded-Host/Proto` sau proxy);
  frontend dùng trực tiếp, không nối domain.
- Module có icon: mặc định khai báo trong `ModuleDescriptor.icon` (tên lucide-react), quản trị viên đổi
  bằng tên lucide khác hoặc upload SVG (`system_module.icon`, `icon_attachment`).
- Module group: account, iam, authentication, attachment, system, health thuộc nhóm `system`; short_links và custom_pages thuộc nhóm `content`.
- Quyền hiện có: `account.user.{read,create,update}`, `iam.role.{read,create,update,assign}`,
  `iam.permission.{read,assign}`, `attachment.file.{read,create,delete}`, `system.module.{read,manage}`,
  `short_links.link.{read,create,update,delete,manage_all}` và `custom_pages.page.{read,create,update,delete,manage_all}`.
  Catalog quyền của từng module đặt tại `app/modules/<module>/permissions/<module>_permission.py`.

## Lệnh quan trọng

| Lệnh | Mục đích |
| --- | --- |
| `uv run python manage.py migrate` | Migration + đồng bộ quyền (post_migrate) |
| `uv run python manage.py sync_iam` | Đồng bộ lại quyền/vai trò hệ thống |
| `uv run python manage.py createsuperuser` | Tạo superuser (cũng là cách khôi phục quyền quản trị) |
| `./scripts/check-all.sh` | Toàn bộ kiểm tra |
