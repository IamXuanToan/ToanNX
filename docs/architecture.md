# Kiến trúc

## Backend (`backend/`)

Quy tắc: **mỗi class một file**, tên file snake_case trùng tên class. `core` không phải Django app
(không có model cụ thể, không có migration).

```
config/                                 # django-admin startproject config .
  settings.py                           # một file cấu hình, đọc biến môi trường
  urls.py                               # /api/v1/{auth,account,iam,attachments,system,health,short_links,custom_pages}
  wsgi.py                               # WSGI `application` + `app` (entrypoint Vercel)
app/
  core/
    constants/error_codes.py            # ErrorCode (StrEnum) ổn định
    context/user_context.py             # contextvars: request_id, current user
    models/core_model.py                # CoreModel (UUID, timestamps, audit, soft delete tùy chọn)
    models/core_query_set.py            # CoreQuerySet.alive()
    repositories/core_repository.py     # CoreRepository[M]: lớp DB duy nhất (đọc + ghi, audit)
    services/core_crud_service.py       # CoreCrudService[M, R]: CRUD ủy quyền cho repository
    views/                              # core_api_view, public_api_view, csrf_public_api_view, core_model_view_set
    decorators/validate_request.py      # @validate_request → view nhận validated_data (+ khai báo OpenAPI)
    pagination/core_page_number_pagination.py   # PageNumberPagination chuẩn DRF (page, page_size ≤ 100)
    schemas/                            # CoreAutoSchema (envelope OpenAPI), response_envelope.py
    serializers/core_validate_serializer.py     # gốc validate serializer (từ chối field lạ)
    responses/                          # core_response.py, core_pagination_response.py, core_error_response.py, response_body.py
    exceptions/                         # app_exception.py + 7 lớp lỗi (mỗi lớp 1 file) + exception_handler.py
    middleware/request_context_middleware.py
    logging/request_context_filter.py
    security/csrf.py                    # enforce_csrf()
    permissions/csrf_protected.py
    registry/                           # permission_definition/catalog, module_descriptor, module_registry
    validators/core_validator.py
    tests/                              # test của core + base/base_api_test_case.py
  modules/<module>/
    apps.py  module.py  urls.py
    permissions/<module>_permission.py  # danh mục quyền của module
    constants/                          # hằng số khác, chỉ tạo khi có
    models/<model>.py                   # mỗi model 1 file; models/__init__.py import để Django nạp
    repositories/<model>_repository.py  # đọc + ghi (lớp DB duy nhất)
    services/<model>_service.py         # nghiệp vụ, mỗi model 1 service
    filters/<model>_filter.py           # django-filter FilterSet cho ViewSet
    serializers/validates/<resource>_<action>_validate_serializer.py   # input theo endpoint
    serializers/responses/<resource>_<kind>_response_serializer.py     # output theo endpoint
    views/<resource>_view_set.py        # CRUD: AdminModelViewSet (router)
    views/<resource>_view.py            # tài nguyên con/hành động: XxxView + XxxObjectView (APIView)
    backends/  authentications/  schemas/  types/  utils/  exceptions/   # chỉ tạo khi có
    tests/                              # test của module (factories/, helpers/ nếu cần)
conftest.py                             # fixture dùng chung cho pytest
```

Luồng: `url → view (+ @require_permission, @validate_request | action_permissions) → service → repository → ORM`.
Chi tiết rule: [rules/backend.md](rules/backend.md).

### Phân tầng

| Tầng | Trách nhiệm | Không được |
| --- | --- | --- |
| View (`views/*_view.py`, `*_view_set.py`) | Khai báo quyền/validate, gọi **service** (tạo trong `__init__`), serialize response | Gọi repository/ORM, nghiệp vụ |
| Service (`services/*_service.py`) | Quy tắc nghiệp vụ, transaction, chống leo thang đặc quyền, điều phối | Tự viết SQL/ORM phức tạp thay repository |
| Repository (`repositories/*_repository.py`) | Lớp DB duy nhất: đọc (queryset gốc, select_related/prefetch) và ghi (audit, lỗi toàn vẹn) | Quy tắc nghiệp vụ |

### View

```
APIView ─ CoreApiView ─┬─ PublicApiView ─ CsrfPublicApiView
                       └─ AuthenticatedApiView ─ AdminApiView
GenericViewSet ─ CoreModelViewSet ─ AdminModelViewSet
```

| Base | Authentication / permission | Dùng cho |
| --- | --- | --- |
| `core/views/public_api_view.py` | `[]` / `[AllowAny]` | `/auth/csrf`, `/health` |
| `core/views/csrf_public_api_view.py` | `[]` / `[AllowAny, CsrfProtected]` | `/auth/login`, `/auth/refresh`, `/auth/logout` |
| `iam/views/authenticated_api_view.py` | mặc định / đăng nhập + active | `/auth/me`, `/auth/sessions`, `/auth/logout-all` |
| `iam/views/admin_api_view.py` | + `is_staff` + method bắt buộc có `@require_permission` | tài nguyên con (vai trò của người dùng, quyền của vai trò) |
| `iam/views/admin_model_view_set.py` | + `is_staff` + `action_permissions` (mặc định DENY) | CRUD: users, roles, permissions, attachments |
| `iam/views/member_api_view.py` | đăng nhập + method bắt buộc có `@require_permission` (không cần `is_staff`) | block của Custom Pages |
| `iam/views/owned_model_view_set.py` | đăng nhập + `action_permissions`, service kiểm tra owner | CRUD: Short Links, Custom Pages |


`CoreModelViewSet` ủy quyền list/retrieve/create/partial_update/destroy cho `service_class`, dùng
validate serializer riêng (`create_serializer_class`, `update_serializer_class`) và response serializer riêng
(`list_serializer_class`, `detail_serializer_class`). Lọc/tìm/sắp xếp/phân trang dùng chuẩn DRF:
`filterset_class` (django-filter), `search_fields` (`?search=`), `ordering_fields` + `ordering` (`?ordering=`),
`CorePageNumberPagination` (`?page=&page_size=`).

`CoreCrudService[M, R]` là gốc của service CRUD; `OwnedCrudService` bổ sung kiểm tra owner và
quyền `manage_all` cho tài nguyên của người dùng. Service nhận dependency qua constructor
(`repository`, `<tên>_repository`, `<tên>_service`) để test dễ thay thế.

### OpenAPI

`CoreAutoSchema` (drf-spectacular) bọc response 2xx vào envelope chuẩn; `CookieJwtAuthenticationScheme` mô tả
cookie `access_token` hoặc Bearer. Schema chỉ phục vụ khi DEBUG (`/api/v1/schema`, `/api/v1/docs`) và được kiểm tra
`--validate --fail-on-warn` trong test.

### Audit

`CoreRepository.create/update/soft_delete/bulk_create` gán `created_by`/`updated_by`/`deleted_by`:
ưu tiên `actor` truyền tường minh, sau đó lấy từ `UserContext`. `Model.save()` **không** tự gán audit.
`QuerySet.update()` và `bulk_update()` phải tự set `updated_by` (đã kiểm thử create/update/bulk_create/context).

### Response & lỗi

```json
{"success": true, "data": {}, "meta": {"request_id": "...", "timestamp": "..."}}
{"success": true, "data": [], "meta": {"request_id": "...", "pagination": {"page":1,"page_size":20,"total":100,"total_pages":5}}}
{"success": false, "error": {"code": "AUTH_INVALID_CREDENTIALS", "message": "...", "details": {}, "request_id": "..."}}
```

HTTP status phản ánh đúng kết quả (400/401/403/404/405/409/422/429/500/503). DELETE trả 204 không body.
Lỗi không lường trước được log kèm request_id; client chỉ nhận `INTERNAL_ERROR`.

## Frontend (`frontend/src/`)

```
app/[locale]/
  layout.tsx                # html gốc theo locale, providers
  (public)/                 # trang công khai
  (auth)/login/             # /vi/dang-nhap, /en/login
  (admin)/admin/            # /vi/quan-tri/..., /en/admin/... (layout render AdminShell của manage-app)
  # page.tsx/layout.tsx chỉ khai metadata, lấy params và render View/Layout của module
modules/<module>/
  views/  components/<c>/{<c>.tsx, hooks/}  hooks/  services/<model>.service.ts  schemas/  types/  messages/
  constants/{routes,api-endpoints,query-keys}.ts   # mỗi module tự khai
modules/manage-app/         # khung quản trị (AdminShell, sidebar, màn chọn module, admin-navigation)
modules/home/               # trang công khai, header, trang 404
shares/
  components/{ui,common,errors,layout,providers}
  lib/api/{api-client,api-error,case-conversion,csrf,session-paths}.ts
  lib/seo.ts                # buildAlternates, createPageMetadata
  hooks/ config/ types/
store/auth-store.ts         # Zustand: cờ phiên hết hạn (không lưu token)
i18n/{routing,navigation,request,messages}.ts
proxy.ts                    # next-intl + kiểm tra lạc quan khu vực admin
```

Luồng: `page` → `View` (ghép + kiểm quyền) → component (+hook riêng) → hook module (React Query) → service (theo model BE) → `apiClient`. FE không có lớp repository.

### API client

- Gọi `/api/v1/*` cùng origin (Next rewrite sang Django), `credentials: same-origin`.
- Gắn `X-Request-ID`, `X-CSRFToken` (tự lấy `/auth/csrf` khi thiếu), timeout 15s.
- Chuyển camelCase ⇄ snake_case chỉ cho plain object/mảng; không đụng `File/Blob/FormData/Date`; hỗ trợ `opaqueKeys`.
- 401 có mã refresh được → refresh single-flight → thử lại **một** lần; refresh thất bại → `markSessionExpired`.
- 403 `AUTH_CSRF_FAILED` → lấy CSRF mới → thử lại một lần.

## Module registry

| Khái niệm | Nơi định nghĩa |
| --- | --- |
| Installed | App trong `INSTALLED_APPS` kế thừa `CoreModuleConfig` → tự đăng ký `module.MODULE` (`code` = `label`) |
| Quyền | `PermissionDefinition` trong descriptor → `sync_iam` ghi vào `iam_permission` |
| Hiển thị | Nhóm, icon, thứ tự khai tĩnh ở FE (`modules/manage-app/constants/admin-navigation.ts` + `navigation.ts` của module) |

Module hiện có và chiều phụ thuộc:

```
attachment ← account (tài khoản, AUTH_USER_MODEL) ← iam (vai trò, quyền) ← authentication
health (độc lập)
```

Module đã cài luôn hoạt động; không có bảng cấu hình, cờ bật/tắt hay icon ở backend.
