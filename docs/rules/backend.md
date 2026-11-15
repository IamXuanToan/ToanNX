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
- Module đã cài luôn hoạt động: **không có** bảng cấu hình module, cờ bật/tắt runtime hay icon ở backend.
  Cách hiển thị module (nhóm, icon, thứ tự) do frontend khai tĩnh (`modules/manage-app`).
- `app/core/tests/test_module_conventions.py` kiểm tra: mọi app trong `app/modules` dùng `CoreModuleConfig`,
  đã đăng ký đúng mã, và mọi view của module kế thừa `CoreApiView`/`CoreModelViewSet`.

## 3. Core (`app/core`) — base duy nhất, module chỉ khai báo

| Thành phần | Dùng khi |
| --- | --- |
| `models/core_model.py` | Mọi entity nghiệp vụ (UUID, timestamps, audit, soft delete tùy chọn) |
| `tracking/journal_tracker.py` | Mixin `JournalTracker`: model kế thừa (đặt **trước** `CoreModel`) thì CRUD tự ghi lịch sử thay đổi |
| `repositories/core_repository.py` | Gốc mọi repository: đọc (`get_queryset` tự ẩn bản đã xóa mềm, `get_queryset_with_deleted`, `get_by_id`, `find_one`, `exists`, `count`…), khóa dòng (`get_for_update`), ghi có audit (`create`, `update`, `update_where`, `bulk_create`), xóa mềm mặc định (`delete`, `delete_where`), xóa cứng tường minh (`hard_delete`, `hard_delete_where`) |
| `services/core_crud_service.py` | Gốc mọi service CRUD: owner (`owner_field`, `manage_all_permission`), quota (`owner_quota_setting`), `*_for(actor)`, `bulk_update`/`bulk_delete`, `log_event` |
| `views/core_api_view.py` | Gốc mọi API không phải CRUD: `get_actor(request)`; bảng override công khai/chỉ đăng nhập |
| `views/core_model_view_set.py` | Gốc mọi CRUD: list/retrieve/create/partial_update/destroy + action `bulk-update`, `bulk-delete`, `history` bật bằng thuộc tính |
| `permissions/` | `IsActiveAuthenticated`, `CsrfProtected` (quyền IAM: `iam/permissions/has_iam_permission.py`) |
| `decorators/` | `validate_request` (input → `validated_data`), `rate_limit` (khóa `RATE_LIMITS` cho APIView) |
| `pagination/core_page_number_pagination.py` | Phân trang **chỉ khi request có `page`/`page_size`** (≤ 100); không có thì trả hết |
| `filters/*` | `CoreSearchFilter` (≤ 100 ký tự, ≤ 5 từ) và bộ lọc nhiều giá trị `Core{Boolean,Choice,Char,UUID}InFilter` (≤ 50 giá trị) |
| `serializers/*` | `CoreValidateSerializer` (từ chối field lạ), bulk ids/result, `CoreJournalEntryResponseSerializer` |
| `schemas/*`, `responses/*`, `exceptions/*`, `registry/*`, `utils/{url,slug}.py` | Envelope OpenAPI/response, lỗi có mã, module registry, URL tuyệt đối/slug |

`app/core` **không import** `app/modules/*` (trừ `TYPE_CHECKING`). Core nối với module qua setting:
`DEFAULT_PERMISSION_CLASSES` (IAM), `DEFAULT_THROTTLE_CLASSES` (bucket PostgreSQL), `CORE_CHANGE_RECORDER`
(journal), `AUTHENTICATION_BACKENDS` (`User.has_perm` hỏi IAM).

Chỉ **hai** lớp view nền; không tạo lớp con theo kiểu quyền. View nào khác thì ghi đè ngay trong view đó:

| Trường hợp | Ghi đè trong view |
| --- | --- |
| Đăng nhập + quyền IAM (mặc định) | không; APIView gắn `@require_permission`, ViewSet khai `action_permissions` |
| Chỉ cần đăng nhập | `permission_classes = [IsActiveAuthenticated]` |
| Công khai, chỉ đọc | `authentication_classes = []`, `permission_classes = [AllowAny]` |
| Công khai, đổi trạng thái bằng cookie | như trên + `CsrfProtected` |
| Công khai, cần biết ai đang xem | `permission_classes = [AllowAny]`, ghi đè `perform_authentication` (token hỏng = khách) |

`test_module_conventions.py` kiểm: mọi view kế thừa hai lớp nền, `permission_classes` chỉ thuộc bảng trên, mọi
action/method mở ra đều có rule quyền.

## 4. Service

- Mỗi model một service, kế thừa `CoreCrudService[Model, Repository]`. Tài nguyên có owner chỉ khai
  `owner_field = "owner"` (hoặc `"created_by"`), `manage_all_permission`, `owner_quota_setting`; không tự viết lọc owner.
  Bản ghi của người khác hoặc đã xóa mềm → `NotFoundError` (không lộ tồn tại).
- Ghi đè `create`/`update`/`delete` khi có luật nghiệp vụ; dùng `get_for_write(actor, pk)` để khóa dòng + kiểm owner.
  `bulk_*` gọi lại `update`/`delete` nên luật tự áp cho thao tác hàng loạt.
- Phụ thuộc tạo trong `__init__` và đặt tên theo lớp: `self.repository`, `self.<tên>_repository`, `self.<tên>_service`.
  Cho phép truyền vào để test. Module khác chỉ gọi **service công khai** (ví dụ `AttachmentService.find_alive_images`).
- Sự kiện không phải đổi field (gán vai trò…) ghi bằng `instance.journal_event("<module>.<event>", data, actor.pk)`.
- Thao tác không cho phép → raise `BusinessRuleError`, không để im lặng. Đóng tường minh action router tự sinh mà
  tài nguyên không hỗ trợ bằng `DENY` trong `action_permissions`.

## 5. View

### 5.1 CRUD → `CoreModelViewSet`

```python
class ShortLinkViewSet(CoreModelViewSet[ShortLink]):
    service_class = ShortLinkService
    filterset_class = ShortLinkFilter                     # ?status=ACTIVE,EXPIRED&owner=<uuid>,<uuid>
    search_fields = ("name", "slug")                      # ?search=
    ordering_fields = ("name", "created_at")              # ?ordering=-created_at
    list_serializer_class = ShortLinkListResponseSerializer
    detail_serializer_class = ShortLinkDetailResponseSerializer
    create_serializer_class = ShortLinkCreateValidateSerializer
    update_serializer_class = ShortLinkUpdateValidateSerializer
    bulk_update_serializer_class = ShortLinkBulkUpdateValidateSerializer   # POST …/bulk-update
    bulk_delete_enabled = True                                             # POST …/bulk-delete
    history_enabled = True                                                 # GET …/{id}/history
    action_rate_limits = {"create": "short_links.create"}                  # settings.RATE_LIMITS
    action_permissions = {
        "list": permission_rule(P.READ), "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE), "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE), "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE), "history": permission_rule(P.READ),
    }
```

- Action không có trong `action_permissions` bị từ chối (mặc định DENY). Khai quyền `create`/`partial_update` mà
  thiếu serializer, hoặc bật `history_enabled` mà model không có `JournalTracker` → lỗi ngay khi import.
- Bulk là action của ViewSet (path `…/bulk-update`, `…/bulk-delete`, không khai URL riêng), body kế thừa
  `CoreBulkIdsValidateSerializer` (1–100 id), trả `{count}`, một transaction.
- Chỉ mở method cần dùng qua `http_method_names`; cập nhật dùng `PATCH`. Đăng ký bằng `SimpleRouter(trailing_slash=False)`.
- **Mọi bộ lọc nhận nhiều giá trị** phân tách dấu phẩy (`app/core/filters/*`); điều kiện suy ra (EXPIRED, ACTIVE…)
  dùng `method=` và gộp OR. Giá trị ngoài `choices`, quá 50 giá trị → 400.
- Danh sách không có `page`/`page_size` trả **toàn bộ** (danh mục, ô chọn); bảng ở FE luôn gửi `page`.
- Đăng nhập `POST /auth/login` nhận `identifier` + `password`; sai thì một lỗi chung `AUTH_INVALID_CREDENTIALS`.
- `User.last_seen_at` chỉ Authentication ghi (tối đa mỗi phút mỗi phiên), không đổi `updated_at`/`updated_by`.

### 5.2 Tài nguyên con/hành động → `CoreApiView`

```python
class UserRoleView(CoreApiView):
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.user_role_service = UserRoleService()

    @extend_schema(responses=RoleSummaryResponseSerializer(many=True))  # OpenAPI: chỉ khai response (phần data)
    @require_permission(IamPermission.ROLE_ASSIGN)          # kiểm tra quyền trước
    @validate_request(UserRoleAssignValidateSerializer)     # rồi mới validate
    def post(self, request: Request, user_id: UUID, validated_data: dict[str, Any]) -> CoreResponse: ...
```

- Method **bắt buộc** có `@require_permission` (thiếu là 403), trừ view ghi đè `permission_classes` theo bảng mục 3.
- Rate limit riêng: `@rate_limit("<khóa>")`; method ghi không khai dùng `default.write`.
- Service tạo trong `__init__` của view, gọi qua `self.<tên>_service`; không `XxxService().method()` trong method.
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
- Lỗi trả 403 `PERMISSION_DENIED` với `details.permissions`. ViewSet dùng `permission_rule(...)`; `DENY` để đóng
  tường minh một action.
- API chỉ theo quyền IAM; **`is_staff` không được kiểm ở API** (chỉ quyết định vào khung quản trị FE).

## 6. OpenAPI

- `CoreAutoSchema` tự bọc response 2xx vào `{success, data, meta}`; ViewSet lấy request body từ
  `create_serializer_class`/`update_serializer_class`; `@validate_request` tự khai báo request/query.
- APIView chỉ cần `@extend_schema(responses=...)` (serializer của `data`; `{204: None}` khi không body).
- Schema phải sạch: `uv run python manage.py spectacular --validate --fail-on-warn`
  (được kiểm tra trong `app/core/tests/test_openapi_schema.py`).

## 7. Phụ thuộc giữa module

- Chiều phụ thuộc khai báo trong `ModuleDescriptor.dependencies` và phải khớp import thực tế:
  `attachment` ← `account` (tài khoản) ← `iam` (vai trò/quyền) ← `authentication`.
- Module nền không import module phụ thuộc nó. Cần hành vi chéo → dùng cơ chế chuẩn của Django:
  authentication backend (`User.has_perm` hỏi `IamPermissionBackend`), signal (`user_credentials_changed`).
- Dữ liệu của module khác không nhét vào response của module nền: vai trò lấy ở `GET /iam/users/{id}/roles`,
  không nằm trong `/account/users`. API tổng hợp (ví dụ `/auth/me`) đặt ở module phụ thuộc cả hai.
- Đổi `AUTH_USER_MODEL` sau khi đã có migration: chỉ làm khi chưa có dữ liệu thật (reset migration);
  có dữ liệu thì phải viết migration chuyển bảng riêng.

## 8. URL tuyệt đối và file

- Mọi URL trả cho client (file, ảnh) dựng bằng `app.core.utils.url.build_absolute_url`:
  domain lấy từ request hiện tại (`X-Forwarded-Host/Proto` sau proxy). FE không nối domain.
- Không trả `file.url` thô. Object storage trả URL tuyệt đối sẵn → giữ nguyên.
- Kiểu file xác định từ nội dung (`file_signature`); SVG phải qua `svg_inspector.find_svg_problem`
  (defusedxml, không `<script>`/`foreignObject`/`on*`/href ngoài/CSS `@import`).
- Field chỉ nhận ảnh dùng `AttachmentService.get_image`.

## 9. Quyền và vai trò

- Quyền khai báo trong `permissions/<module>_permission.py` (kế thừa `PermissionCatalog`), dạng
  `PermissionDefinition(code="module.resource.action", name=..., description=...)`. Chỉ khai báo quyền của
  chức năng đã có API.
- `module.py`: `ModuleDescriptor(code=..., name=..., description=..., version=..., permissions=XxxPermission.all(), dependencies=(...))`.
- Không hardcode mã vai trò trong code. Vai trò hệ thống seed bằng data migration; quyền tự cấp theo
  `Role.auto_grant` (`all` / `read_only` / `none`) mỗi lần `sync_iam`/`migrate`.
- Superuser bỏ qua kiểm tra quyền tầng ứng dụng (trừ `check`), không bỏ qua đăng nhập.

### Xoá và thao tác hàng loạt

- Xoá mặc định là **xoá mềm**: `CoreRepository.delete` / `delete_where`, `CoreCrudService.delete`, action
  `destroy` và `bulk-delete`. Có quyền `<module>.<resource>.delete` riêng. `get_queryset` gốc của repository tự ẩn
  bản đã xoá (lớp con gọi `super().get_queryset()`), nên bản ghi đã xoá biến mất khỏi API, đăng nhập và kiểm quyền.
- Xoá cứng chỉ khi **thực sự cần** và gọi tường minh `hard_delete` / `hard_delete_where`, kèm một dòng chú thích lý
  do. Hiện có: dọn phiên/token/bucket hết hạn, dọn journal quá hạn giữ, gỡ gán vai trò/quyền (bảng nối, lịch sử
  đã ghi ở journal). Gọi `delete` trên model không có `deleted_at` → `TypeError` (không lặng lẽ xoá cứng).
- Thao tác hàng loạt là action có sẵn của `CoreModelViewSet` (mục 5.1); `CoreCrudService.bulk_*` gọi lại
  `update`/`delete` từng bản ghi trong **một transaction**: cùng luật nghiệp vụ, lỗi một dòng thì không dòng nào đổi.

## 10. Model, serializer, migration

- **Mọi field có thể khai báo `help_text` đều phải có** (model field, serializer field, filter):
  model field kèm `verbose_name` tiếng Việt và `db_comment`; đặt `db_table`.
- File/ảnh lưu qua module `attachment` (FK tới `attachment.Attachment`), không dùng URL tự do.
- Migration sinh bằng `makemigrations`; data migration tạo bằng `makemigrations <app> --empty --name ...`.
- Đổi kiểu cột không tương thích (ví dụ varchar → FK uuid) phải `RemoveField` + `AddField`.
- Không chạy migration khi cold start/request; chạy thủ công trước khi deploy.

## 11. Lỗi, log, bảo mật

- Raise `ValidationError`/`AuthorizationError`/`NotFoundError`/`ConflictError`/`BusinessRuleError`... kèm mã lỗi.
  Core chỉ giữ mã chung (`ErrorCode`); mã riêng nằm ở `app/modules/<m>/constants/<m>_error_code.py` (StrEnum,
  tiền tố theo module: `ACCOUNT_*`, `IAM_*`, `CUSTOM_PAGES_*`…). `core/tests/test_error_codes.py` kiểm mã không trùng
  và FE có bản dịch vi/en cho mọi mã.
- Quy tắc kiểm tra riêng của module đặt trong module (`account/validators/password_validator.py`,
  `iam/constants/role_code.py`); `CoreValidator` chỉ giữ định dạng dùng chung của core.
- Lỗi không lường trước để exception handler log + trả `INTERNAL_ERROR`.
- Request đổi trạng thái bằng cookie phải qua CSRF.
- Password chỉ qua `set_password`/validators của Django.

## 12. Test

- pytest + pytest-django trên PostgreSQL (`test_toannx`). Fixture chung ở `backend/conftest.py`.
- Base assertion: `app/core/tests/base/base_api_test_case.py`. Factory/helper IAM: `app/modules/iam/tests/`.
- Mỗi endpoint mới: test thành công, validate sai, chưa đăng nhập, thiếu quyền, quy tắc nghiệp vụ, owner (người
  khác nhận 404); API danh sách thêm test `search`/filter nhiều giá trị/`ordering`/phân trang.
- Mỗi endpoint danh sách thêm một dòng vào `core/tests/test_list_query_count.py` (số query không tăng theo số bản ghi).
- Factory trong `tests/factories/` của module; model có `JournalTracker` test thêm lịch sử (`…/history`).

## 13. Công cụ

```bash
uv run ruff format . && uv run ruff check . && uv run mypy . && uv run pytest -q
uv run python manage.py spectacular --validate --fail-on-warn --file schema.yaml
```
