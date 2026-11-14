# Rule backend (Django + DRF)

Đọc trước: [common.md](common.md).

## 1. Luồng xử lý (bắt buộc)

```
url → view (+ @require_permission, @validate_request | action_permissions) → service → repository → ORM
                                   ↓
                     serializers/responses (chỉ chuyển dữ liệu ra JSON)
```

| Lớp | Được làm | Không được làm |
| --- | --- | --- |
| `urls.py` | Map path → view/router | Logic |
| View | Khai báo quyền/validate, gọi **service**, serialize response, set cookie | Gọi repository/ORM, nghiệp vụ |
| Service | Nghiệp vụ, transaction, kiểm tra quyền trên đối tượng, điều phối service khác | Gọi ORM trực tiếp (`Model.objects...`, `connection.cursor`) |
| Repository | **Duy nhất** truy cập DB (đọc + ghi), audit | Quy tắc nghiệp vụ |
| FilterSet (`filters/`) | Khai báo lọc theo field cho ViewSet (django-filter) | Nghiệp vụ, phân quyền |
| Serializer validate | Kiểm tra contract input | Truy vấn DB, gọi service |
| Serializer response | Chuyển object/dataclass → dict | Truy vấn DB, gọi service (dữ liệu phải được service/repository dựng sẵn, kể cả prefetch) |

- Không có lớp selector: đọc và ghi đều qua repository.
- Không gọi `Model.objects.filter(...).first()` ngoài repository; thêm method có tên vào repository
  (ví dụ `UserRepository.find_by_email`) và gọi qua service.
- Module khác chỉ dùng **service công khai** của nhau (ví dụ `account.UserService` dùng `AttachmentService`), không
  import repository của module khác.

## 2. Cấu trúc module

```
app/modules/<module>/
  apps.py  module.py  urls.py  signals.py (nếu có)
  permissions/<module>_permission.py        # PermissionCatalog có name + description
  models/<model>.py  models/__init__.py     # __init__ import model để Django nạp
  repositories/<model>_repository.py        # kế thừa CoreRepository
  services/<model>_service.py               # mỗi model một service (+ service điều phối nếu cần)
  filters/<model>_filter.py                 # FilterSet cho ViewSet (nếu có lọc)
  serializers/validates/<resource>_<action>_validate_serializer.py
  serializers/responses/<resource>_<kind>_response_serializer.py   # mỗi endpoint một response
  views/<resource>_view_set.py              # CRUD trên model
  views/<resource>_view.py                  # XxxView (collection) + XxxObjectView (theo id)
  schemas/  types/  utils/  decorators/  constants/  exceptions/   # chỉ tạo khi có
  tests/                                    # test của module
  migrations/
```

Tạo module: `uv run python manage.py startapp <m> app/modules/<m>` rồi tổ chức như trên.

### 2.1 Khai báo module (mã module chỉ viết **một lần**)

```python
# app/modules/custom_pages/apps.py
class CustomPagesConfig(CoreModuleConfig):
    """App Custom Pages."""

    default = True                      # bắt buộc (Django chọn đúng config trong apps.py)
    name = "app.modules.custom_pages"
    label = "custom_pages"              # = MODULE.code
    verbose_name = "Custom Pages"

# app/modules/custom_pages/module.py
MODULE = ModuleDescriptor(code="custom_pages", ..., permissions=CustomPagesPermission.all())
```

- `apps.py` kế thừa `CoreModuleConfig` (không dùng `AppConfig` trực tiếp): tự nạp `module.MODULE`,
  đăng ký vào registry và **bắt buộc `MODULE.code == label`** (sai → lỗi khi khởi động).
- Không viết `ready()` chỉ để đăng ký module. Cần thêm việc khi khởi động (signal, post_migrate,
  OpenAPI extension) thì override `ready()` và gọi `super().ready()` trước.
- **Không** khai `module_code` trên view, **không** tự thêm `ModuleEnabled` vào `permission_classes`:
  `CoreApiView`/`CoreModelViewSet.get_permissions()` tự gắn `settings.MODULE_PERMISSION_CLASSES`
  (`ModuleEnabled`), module của view suy ra từ app chứa class view. Chỉ khai `module_code` khi view
  đặt ở app này nhưng thuộc module khác (hiếm).
- `app/core/tests/test_module_conventions.py` kiểm tra: mọi app trong `app/modules` dùng `CoreModuleConfig`,
  đã đăng ký đúng mã, và mọi view của module đều có kiểm tra module đang bật.

## 3. Core (`app/core`)

| Thành phần | Dùng khi |
| --- | --- |
| `models/core_model.py` | Mọi entity nghiệp vụ (UUID, timestamps, audit, soft delete tùy chọn) |
| `repositories/core_repository.py` | Gốc mọi repository: `get_queryset`, `get_all`, `filter`, `exclude`, `get_by_id`, `find_by_id`, `get_one`, `find_one`, `get_by_ids`, `exists`, `count`, `values_list`, `get_for_update`, `create`, `update`, `save`, `soft_delete`, `hard_delete`, `update_where`, `delete_where`, `bulk_create` |
| `services/core_crud_service.py` | Gốc service CRUD một model: `get_queryset`, `get_by_id`, `create`, `update`, `delete`; override để thêm nghiệp vụ |
| `views/core_api_view.py` | Gốc mọi APIView: `get_actor(request)`, tự gắn kiểm tra module (`get_permissions`) |
| `views/public_api_view.py` | API công khai chỉ đọc: `authentication_classes = []`, `permission_classes = [AllowAny]` |
| `views/csrf_public_api_view.py` | API công khai đổi trạng thái bằng cookie: `[AllowAny, CsrfProtected]` |
| `views/core_model_view_set.py` | Gốc ViewSet CRUD ủy quyền cho service, tự gắn kiểm tra module |
| `permissions/module_permissions.py` | Nạp `settings.MODULE_PERMISSION_CLASSES` (core không import module cụ thể) |
| `pagination/core_page_number_pagination.py` | Phân trang mặc định (`page`, `page_size` ≤ 100) |
| `decorators/validate_request.py` | Validate input; view nhận `validated_data`; tự khai báo request trong OpenAPI |
| `serializers/core_validate_serializer.py` | Gốc của mọi validate serializer (từ chối field lạ) |
| `schemas/*` | `CoreAutoSchema` (envelope response trong OpenAPI), `response_envelope` |
| `responses/*` | `CoreResponse`, `CorePaginationResponse`, `CoreErrorResponse` |
| `exceptions/*` | Raise lỗi nghiệp vụ có `ErrorCode` |
| `registry/*` | `CoreModuleConfig`, `ModuleDescriptor` (có `group`, `icon`), `ModuleGroup`, `PermissionCatalog`, `PermissionDefinition` |

`app/core` **không import** `app/modules/*` (trừ `TYPE_CHECKING`). Thứ gì cần IAM/System (ví dụ
`OwnedCrudService`, `OwnedModelViewSet`) đặt trong module đó; core nối với module qua setting
(`MODULE_PERMISSION_CLASSES`, `AUTHENTICATION_BACKENDS`...).

Lớp gốc khai báo mặc định; lớp con **ghi đè thuộc tính** khi cần (OOP), không lặp lại cấu hình:

```
APIView ─ CoreApiView ─┬─ PublicApiView ─ CsrfPublicApiView
                       └─ AuthenticatedApiView (iam) ─┬─ MemberApiView (iam)
                                                      └─ AdminApiView (iam)
GenericViewSet ─ CoreModelViewSet ─┬─ AdminModelViewSet (iam)
                                   └─ OwnedModelViewSet (iam)
```

| Lớp | Xác thực / quyền | Dùng cho |
| --- | --- | --- |
| `PublicApiView` | không / `AllowAny` | API công khai chỉ đọc |
| `CsrfPublicApiView` | không / `AllowAny` + CSRF | login, refresh, logout |
| `AuthenticatedApiView` | đăng nhập | dữ liệu của chính mình (`/auth/me`, sessions) |
| `MemberApiView` | đăng nhập + `@require_permission` | người dùng thường thao tác tài nguyên con có quyền IAM |
| `AdminApiView` | đăng nhập + `is_staff` + `@require_permission` | API quản trị không theo CRUD |
| `AdminModelViewSet` | đăng nhập + `is_staff` + `action_permissions` | CRUD quản trị |
| `OwnedModelViewSet` | đăng nhập + `action_permissions`; service kiểm tra owner | CRUD tài nguyên của người dùng |

Mọi lớp trên đều tự kiểm tra module đang bật (403 `MODULE_DISABLED`).

## 4. Service

- Mỗi model một service, kế thừa `CoreCrudService[Model, Repository]` khi là CRUD.
- Phụ thuộc tạo trong `__init__` và đặt tên theo lớp: `self.repository` (repository chính),
  `self.<tên>_repository`, `self.<tên>_service`. Cho phép truyền vào để dùng chung/test:

  ```python
  class UserRoleService:
      def __init__(self, user_service: UserService | None = None) -> None:
          self.repository = UserRoleRepository()
          self.user_service = user_service or UserService()
  ```

- Thao tác không cho phép (ví dụ xóa user) → override và raise `BusinessRuleError`, không để im lặng.

## 5. View

### 5.1 CRUD trên model → `AdminModelViewSet` hoặc `OwnedModelViewSet`

```python
class UserViewSet(AdminModelViewSet[User]):
    service_class = UserService
    filterset_class = UserFilter                                  # ?is_active=true
    search_fields = ("email", "username", "first_name", "last_name")  # ?search=
    ordering_fields = ("created_at", "email", "last_login")       # ?ordering=-email
    ordering = ("-created_at",)                                   # mặc định
    list_serializer_class = UserListResponseSerializer
    detail_serializer_class = UserDetailResponseSerializer
    create_serializer_class = UserCreateValidateSerializer
    update_serializer_class = UserUpdateValidateSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]
    action_permissions = {
        "list": permission_rule(IamPermission.USER_READ),
        "retrieve": permission_rule(IamPermission.USER_READ),
        "create": permission_rule(IamPermission.USER_CREATE),
        "partial_update": permission_rule(IamPermission.USER_UPDATE),
    }
```

- API quản trị dùng `AdminModelViewSet` và yêu cầu `is_staff`. Tài nguyên người dùng tự quản lý dùng
  `iam/views/owned_model_view_set.py` với service kế thừa `iam/services/owned_crud_service.py`
  (`OwnedCrudService`): kiểm tra IAM action, owner trong service (người khác nhận 404). Quyền
  `manage_all` chỉ mở phạm vi owner, vẫn cần quyền action.
- Action không có trong `action_permissions` bị từ chối (mặc định DENY).
- Chỉ mở method cần dùng qua `http_method_names`; cập nhật dùng `PATCH`.
- Lọc/tìm/sắp xếp/phân trang dùng chuẩn DRF + django-filter (`DEFAULT_FILTER_BACKENDS`); không tự viết.
  `ordering` ngoài `ordering_fields` bị bỏ qua; trang vượt quá → 404.
- Đăng ký bằng `SimpleRouter(trailing_slash=False)`.

### 5.2 Tài nguyên con/hành động → `AdminApiView` hoặc `MemberApiView`

```python
class UserRoleView(AdminApiView):
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.user_role_service = UserRoleService()

    @extend_schema(responses=RoleSummaryResponseSerializer(many=True))  # OpenAPI: chỉ khai response (phần data)
    @require_permission(IamPermission.ROLE_ASSIGN)          # kiểm tra quyền trước
    @validate_request(UserRoleAssignValidateSerializer)     # rồi mới validate
    def post(self, request: Request, user_id: UUID, validated_data: dict[str, Any]) -> CoreResponse:
        self.user_role_service.assign_role(self.get_actor(request), user_id, validated_data["role_id"])
        roles = self.user_role_service.list_roles(user_id)
        return CoreResponse(RoleSummaryResponseSerializer(roles, many=True).data)
```

- Service tạo trong `__init__` của view, gọi qua `self.<tên>_service`; không `XxxService().method()` trong method.
  Áp dụng cho mọi lớp có vòng đời riêng: view, authentication backend (`AccountAuthBackend.__init__`), command.
- `AdminApiView`: method **bắt buộc** có `@require_permission` (thiếu là bị từ chối).
- `MemberApiView`: người dùng thường (không cần `is_staff`), method **bắt buộc** có `@require_permission`;
  service kiểm tra owner của tài nguyên cha. Không tự ghép `AuthenticatedApiView` + `HasDeclaredPermission`.
- `AuthenticatedApiView`: chỉ cần đăng nhập (dữ liệu của chính mình). API công khai dùng
  `PublicApiView` / `CsrfPublicApiView`.
- Không khai `permission_classes` chỉ để thêm kiểm tra module; xem mục 2.1.
- Lấy người thực hiện bằng `self.get_actor(request)`. DELETE trả `Response(status=204)` không body.

### 5.3 `@require_permission` / `permission_rule`

```python
@require_permission(P.USER_READ)                                  # một quyền
@require_permission(P.ROLE_ASSIGN, P.USER_UPDATE)                 # ít nhất một (any-of)
@require_permission(P.ROLE_ASSIGN, P.USER_UPDATE, require_all=True)  # đủ tất cả
@require_permission(P.USER_UPDATE, check=is_not_self)             # AND điều kiện riêng (cả superuser)
@require_permission(P.USER_READ, allow_if=is_owner)               # OR: chính chủ được phép
```

- `check`/`allow_if`: `Callable[[Request, view], bool]`, không truy vấn DB nặng.
- Lỗi trả 403 `PERMISSION_DENIED` với `details.permissions` là danh sách mã quyền yêu cầu.
- ViewSet dùng `permission_rule(...)` cùng tham số trong `action_permissions`.

## 6. OpenAPI

- `CoreAutoSchema` tự bọc response 2xx vào `{success, data, meta}`; ViewSet lấy request body từ
  `create_serializer_class`/`update_serializer_class`; `@validate_request` tự khai báo request/query.
- APIView chỉ cần `@extend_schema(responses=...)` (serializer của `data`; `{204: None}` khi không body).
- Schema phải sạch: `uv run python manage.py spectacular --validate --fail-on-warn`
  (được kiểm tra trong `app/core/tests/test_openapi_schema.py`).

## 7. Phụ thuộc giữa module

- Chiều phụ thuộc khai báo trong `ModuleDescriptor.dependencies` và phải khớp import thực tế:
  `account` (tài khoản) ← `iam` (vai trò/quyền) ← `authentication`, `system`.
- Module nền không import module phụ thuộc nó. Cần hành vi chéo → dùng cơ chế chuẩn của Django:
  authentication backend (`User.has_perm` hỏi `IamPermissionBackend`), signal (`user_credentials_changed`).
- Dữ liệu của module khác không nhét vào response của module nền: vai trò lấy ở `GET /iam/users/{id}/roles`,
  không nằm trong `/account/users`. API tổng hợp (ví dụ `/auth/me`) đặt ở module phụ thuộc cả hai.
- Đổi `AUTH_USER_MODEL` sau khi đã có migration: chỉ làm khi chưa có dữ liệu thật (reset migration);
  có dữ liệu thì phải viết migration chuyển bảng riêng.

## 8. URL tuyệt đối và file

- Mọi URL trả cho client (file, ảnh, icon) dựng bằng `app.core.utils.absolute_url.build_absolute_url`:
  domain lấy từ request hiện tại (`X-Forwarded-Host/Proto` sau proxy). FE không nối domain.
- Không trả `file.url` thô. Object storage trả URL tuyệt đối sẵn → giữ nguyên.
- Kiểu file xác định từ nội dung (`file_signature`); SVG phải qua `svg_inspector.find_svg_problem`
  (defusedxml, không `<script>`/`foreignObject`/`on*`/href ngoài/CSS `@import`).
- Field chỉ nhận ảnh dùng `AttachmentService.get_image`; chỉ nhận SVG dùng `get_svg`.

## 9. Icon module

- `ModuleDescriptor(icon="shield-check")`: tên lucide-react kebab-case (`CoreValidator.is_icon_name`).
- Quản trị viên đổi qua `PATCH /system/modules/{code}`: `icon` (tên lucide, rỗng = mặc định) hoặc
  `icon_id` (attachment SVG, null = gỡ). Response có `icon` (hiệu lực) và `icon_url` (SVG tuyệt đối hoặc null).

## 10. Quyền và vai trò

- Quyền khai báo trong `permissions/<module>_permission.py` (kế thừa `PermissionCatalog`), dạng
  `PermissionDefinition(code="module.resource.action", name=..., description=...)`. Chỉ khai báo quyền của
  chức năng đã có API.
- `module.py`: `ModuleDescriptor(..., group=ModuleGroup.SYSTEM, permissions=XxxPermission.all())`.
- Không hardcode mã vai trò trong code. Vai trò hệ thống seed bằng data migration; quyền tự cấp theo
  `Role.auto_grant` (`all` / `read_only` / `none`) mỗi lần `sync_iam`/`migrate`.
- Superuser bỏ qua kiểm tra quyền tầng ứng dụng (trừ `check`), không bỏ qua đăng nhập.

## 11. Model, serializer, migration

- **Mọi field có thể khai báo `help_text` đều phải có** (model field, serializer field, filter):
  model field kèm `verbose_name` tiếng Việt và `db_comment`; đặt `db_table`.
- File/ảnh lưu qua module `attachment` (FK tới `attachment.Attachment`), không dùng URL tự do.
- Migration sinh bằng `makemigrations`; data migration tạo bằng `makemigrations <app> --empty --name ...`.
- Đổi kiểu cột không tương thích (ví dụ varchar → FK uuid) phải `RemoveField` + `AddField`.
- Không chạy migration khi cold start/request; chạy thủ công trước khi deploy.

## 12. Lỗi, log, bảo mật

- Raise `ValidationError`/`AuthorizationError`/`NotFoundError`/`ConflictError`/`BusinessRuleError`... kèm `ErrorCode`.
  Mã lỗi theo module sở hữu nghiệp vụ: tài khoản `ACCOUNT_*` (account), vai trò/quyền `IAM_*` (iam),
  cấu hình module `MODULE_*` (system), phiên đăng nhập `AUTH_*` (authentication).
- Quy tắc kiểm tra riêng của module đặt trong module (`account/validators/password_validator.py`,
  `iam/constants/role_code.py`); `CoreValidator` chỉ giữ định dạng dùng chung của core.
- Lỗi không lường trước để exception handler log + trả `INTERNAL_ERROR`.
- Request đổi trạng thái bằng cookie phải qua CSRF.
- Password chỉ qua `set_password`/validators của Django.

## 13. Test

- pytest + pytest-django trên PostgreSQL (`test_toannx`). Fixture chung ở `backend/conftest.py`.
- Base assertion: `app/core/tests/base/base_api_test_case.py`. Factory/helper IAM: `app/modules/iam/tests/`.
- Mỗi endpoint mới: test thành công, validate sai, chưa đăng nhập, thiếu quyền, quy tắc nghiệp vụ;
  API danh sách thêm test `search`/filter/`ordering`/phân trang.

## 14. Công cụ

```bash
uv run ruff format . && uv run ruff check . && uv run mypy . && uv run pytest -q
uv run python manage.py spectacular --validate --fail-on-warn --file schema.yaml
```
