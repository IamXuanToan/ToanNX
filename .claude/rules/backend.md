---
paths:
  - "backend/**/*.py"
---

<!-- Sinh tự động từ .agents/rules/10-backend.md bằng scripts/sync-ai-rules.py. Không sửa tay. -->

# Backend (Django 6 + DRF)

Chi tiết: `docs/rules/backend.md`, `docs/architecture/`, `docs/common-catalog.md` mục 1–3.

## Lớp và phụ thuộc

- Luồng bắt buộc `url → view → service → repository → ORM`. **Chỉ repository chạm DB.**
- Mọi điểm vào (view, task, command, signal, middleware, authentication/permission class, recorder, decorator) chỉ
  gọi service; không `XxxRepository()`, `Model.objects`, không nghiệp vụ, không `@transaction.atomic` ở đó.
- Service/repository một class dùng phải tạo trong `__init__` (`self.<tên>_service`). Trong method cấm
  `XxxService().x()` / `XxxService.x()`. Method công khai của service không `@staticmethod`/`@classmethod`.
- Chỉ hai base view: `CoreApiView` (`@require_permission` từng method) và `CoreModelViewSet`
  (`action_permissions` mặc định DENY). Service CRUD kế thừa `CoreCrudService` (`owner_field`,
  `manage_all_permission`, `owner_quota_setting`, `public_cache_namespace`).
- Input qua `@validate_request` + `serializers/validates/`; output qua `serializers/responses/`; envelope cố định
  `{success, data, meta}` và mã lỗi ổn định (`ErrorCode` + `constants/<m>_error_code.py`).
- Xóa mềm mặc định; xóa cứng chỉ qua `hard_delete`/`hard_delete_where` kèm lý do.

## Tổ chức file

- Một class cấp module mỗi file, tên file snake_case theo class. Serializer, dataclass, exception không lẫn file khác.
- Enum field của model lồng trong model hoặc cạnh model cùng file; enum dùng chung ở `constants/`.
- Hằng số, kiểu, tiện ích ở `constants/`, `types/`, `utils/` (hằng mặc định toàn BE ở
  `app/core/constants/defaults.py`). Không magic number/string (locale, timezone, tiền tệ, Content-Type, mẫu
  email, chuỗi thông báo lặp), không `print`, không nuốt lỗi.

## Module

- Mỗi app có `ModuleDescriptor` trong `module.py`: `member_permissions=(*XxxPermission.member(), ...)`,
  `notification_events`, `webhooks`, `callbacks`, `cleanup_tasks`. Endpoint bên thứ ba gọi vào phải khai ở
  `webhooks`/`callbacks`; không hardcode domain (`build_backend_url`, `get_frontend_origin`).
- ViewSet có `destroy` → `bulk_delete_enabled = True`; cờ boolean bật/tắt → `bulk_update_serializer_class`. ViewSet
  chỉ đọc mở `post` cho bulk → `"create": DENY`.

## OpenAPI

- `spectacular --validate --fail-on-warn` phải sạch. **Đổi bất kỳ thứ gì đi vào OpenAPI** (route, view, serializer,
  `@extend_schema`, `help_text`, mã lỗi, **docstring class view / method HTTP**) → chạy `pnpm api:types` và commit
  `api-schema.gen.ts` cùng lần; CI đỏ nếu lệch.

## Thông báo, cache, bên thứ ba

- Thông báo chỉ qua `NotificationService.notify` (xem rule `notifications`). Request không gọi FCM/SMTP/Telegram.
- Mọi lời gọi dịch vụ ngoài có timeout (≤ 5 giây). Redis qua `CacheService`, lỗi thì dự phòng, không 500.
- Bí mật hệ thống tự tạo/kiểm dẫn xuất từ `DJANGO_SECRET_KEY` (`salted_hmac`, `signing`); token bên thứ ba của
  từng người lưu DB qua `SecretCipher`.

## Kiểm tra

`uv run ruff format <file>`, `uv run ruff check <file>`, `uv run mypy <file>`, pytest đúng file test trên DB local
`--reuse-db`. Bảng kiểm tự động: `.agents/rules/90-done-checklist.md`.
