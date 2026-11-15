# Reference audit — PMS & Medoly

Đã đọc trực tiếp source (chỉ đọc, không sửa, không copy credentials):

- Backend: `D:\projects\PMS\PMS-AZ-BE` (Django 5.1, DRF 3.15, simplejwt, Celery/Redis/Channels).
- Frontend: `D:\Medoly\frontend\src\shares\components\{common,errors,layout,tiptap,ui}` (Next 16, shadcn new-york/zinc).

Không có file LICENSE ở cả hai repo; cả hai là dự án của chủ repo. Phần UI gốc từ shadcn/ui (MIT).

## 1. PMS — đã kiểm tra

| Thành phần | File | Đánh giá | Quyết định cho TOANNX |
| --- | --- | --- | --- |
| BaseModel | `core/models/base_model.py` | Gán audit ngầm trong `save()` từ context; **3 truy vấn `exists()` mỗi lần save** để kiểm tra user; `delete()` bị ghi đè thành soft delete cho mọi model; sửa mã unique khi xóa | **Refactor**: `CoreModel` chỉ khai báo field (UUID, timestamps, audit, `deleted_*`); audit do repository gán; soft delete là tùy chọn theo model |
| Managers / SoftDeleteQuerySet | `core/models/manager/*` | Manager mặc định ẩn bản ghi xóa → dễ lọt dữ liệu ở join; `QuerySet.delete()` ngầm thành update | **Không dùng** cơ chế ẩn ngầm; có `CoreQuerySet.alive()` tường minh |
| CoreRepository | `core/repositories/core_repository.py` | Wrapper mỏng 30+ hàm quanh ORM, không thêm giá trị, `model=None` lúc init | **Refactor**: `CoreRepository[M]` generic, chỉ giữ hàm có giá trị (audit, savepoint + `ConflictError`, `get_for_update`) |
| Context | `core/context.py` | Ý tưởng ContextVar đúng, nhưng **không bao giờ reset** → rò user giữa request khi tái dùng thread | **Kế thừa ý tưởng**, có `request_context()` reset trong `finally` |
| Middleware | `core/middleware.py` | Tự xác thực JWT lại lần 2, `except Exception: pass` | **Không dùng**; middleware chỉ gắn request_id; user được set bởi authentication class |
| Responses | `core/responses/*` | `{data, errors}`, 10 lớp gần trùng nhau, lỗi là mảng chuỗi mã | **Refactor** thành 3 lớp, có `success`, `meta.request_id`, `error.code` |
| ErrorCode | `core/error_code.py` | Trùng khóa (`DATA_CONFLICT_CUSTOMER`), giá trị tuple do dấu phẩy thừa (`UNIQUE_CONSTRAINT`), lẫn mã nghiệp vụ | **Refactor**: `StrEnum` gọn, chỉ mã dùng thật |
| Exception handling | `core/utils.py::custom_exception_handler`, `decorators.handle_exception` | Mọi exception chưa biết → 500 nhưng dùng `exception_handler` DRF nửa vời; decorator bọc từng view | **Refactor**: một `EXCEPTION_HANDLER` DRF; `AppException` có code/status/details |
| Permission | `decorators.required_permissions`, `*/permissions/*.py` | Dựa `user_permissions` của Django, trả 403 kể cả khi chưa đăng nhập, quyền dạng `app.action_model` | **Thay thế** bằng RBAC riêng `module.resource.action` + DRF permission class, default deny |
| User model | `organizations/models/user.py` | `AbstractUser` + nhiều field HR, FK `org_unit` CASCADE, `created_on` trùng `created_at` | **Không copy**. Tạo User tối giản theo yêu cầu, `AbstractBaseUser`, email unique chữ thường |
| Validators | `core/validate.py` | Hàm dùng lại tốt nhưng import ngược từ module `systems`/`organizations` | **Kế thừa ý tưởng** validate mật khẩu qua Django validators; không phụ thuộc module |
| MasterViewBase | `core/views/master_view_base.py` | Generic CRUD view, `required_permissions([])` rỗng = cho phép tất cả | **Không dùng** (rủi ro mở quyền ngầm) |
| Test base | `core/tests/base/*`, `reuse/*` | Bộ test CRUD theo abstract method, factory theo module, `strip_keys` | **Kế thừa** ý tưởng assertion dùng chung (`BaseApiTestCase`), factory_boy; không tạo base CRUD khi chưa có CRUD lặp |
| Settings | `PMS/settings.py` | Một file, `CORS_ALLOW_ALL_ORIGINS=True`, `python-decouple` | **Giữ một file settings** (theo yêu cầu), dùng django-environ; CORS whitelist |
| Logging | `LOGGING` | Ghi file `logs/` | **Không dùng file** (Vercel không có filesystem bền); log stdout kèm request_id |

Không dùng: Celery, Redis, Channels, Firebase, Google API, simplejwt (thay bằng PyJWT + refresh lưu hash để
xoay vòng/thu hồi theo phiên), mọi module nghiệp vụ (customers, projects, workflows, timekeeping...).

## 2. Medoly — đã kiểm tra

| Thành phần | Đánh giá | Quyết định |
| --- | --- | --- |
| `ui/*` (button, input, dialog, select, ...) | Bản shadcn new-york chỉnh tay; một số bỏ focus ring (`focus-visible:ring-0`) → kém accessibility | **Không copy**. Sinh lại bằng `shadcn add` (style radix-nova, có focus ring) để cập nhật được bằng CLI |
| `common/password-input-common.tsx` | Tốt, có aria-label | **Kế thừa** → `shares/components/common/password-input/password-input.tsx` (bỏ icon khóa, dùng `cn`) |
| `common/common-empty-state.tsx` | Hardcode `indigo-*` | **Refactor** → `empty-state.tsx` dùng token `muted` |
| `errors/error-state-card.tsx` | Hardcode `rose-*`/`slate-*` | **Refactor** → `error-state.tsx` dùng token `destructive` |
| `common/common-pagination.tsx` | Tự đọc/ghi URL search params, ô nhập trang | **Refactor** → `data-pagination.tsx` có kiểm soát (props), đơn giản hơn |
| `layout/locale-switcher.tsx` | Chỉ đổi pathname, **mất query và params động**, cờ emoji | **Refactor** → `language-switcher.tsx` giữ params + query |
| `layout/header.tsx`, `footer.tsx` | Gắn nghiệp vụ storefront Medoly | **Không dùng** |
| `common/common-data-table/*` | Rất lớn (excel, pin cột, tree mode) | **Không copy** (chưa cần); bảng dùng shadcn `table` + phân trang |
| `common/product-card`, `trust-bar`, `price-block`, `rating-stars` | Nghiệp vụ Medoly | **Không dùng** |
| i18n (`src/i18n/*`) | next-intl `pathnames`, message gộp theo file | **Kế thừa** cấu trúc; message tách theo module |
| `proxy.ts` | Chỉ next-intl | **Mở rộng** thêm kiểm tra lạc quan admin |

### Tiptap (ghi nhận cho Novel/CMS, chưa tích hợp)

Medoly dùng `@tiptap/react` 3.x + starter-kit, link, image, table, text-align, underline, placeholder;
API component: `value` (HTML), `onChange(html)`, `readOnly`, `onImageUpload(file) => url`, `toolbar`, `minHeight`.
Khi triển khai Novel/CMS:
- Đặt tại `src/shares/components/editor/` (hoặc trong module nếu chỉ một module dùng), load bằng `next/dynamic` `ssr:false`.
- Lưu nội dung dạng **JSON ProseMirror** (không chỉ HTML) để render an toàn; nếu render HTML phải sanitize server-side.
- `onImageUpload` phải đi qua API upload lên object storage (Vercel Blob/S3), không lưu filesystem.
- Dùng màu token theme thay vì CSS riêng `tiptap.styles.css` hardcode.

## 3. Quyết định kiến trúc rút ra

1. Audit tường minh qua repository thay vì `save()` ngầm (hiệu năng + dễ test).
2. Context có phạm vi request, luôn reset.
3. Một exception handler, mã lỗi ổn định, HTTP status đúng.
4. RBAC riêng làm nguồn sự thật duy nhất; không dùng song song quyền Django.
5. Default deny ở DRF; không có generic view "cho phép khi danh sách quyền rỗng".
6. UI primitives sinh bằng CLI, component dùng chung chỉ copy khi có nhu cầu thật và chuẩn hóa về token theme.
