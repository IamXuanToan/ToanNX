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
| Điểm vào khác (task, command, signal, middleware, authentication, permission, recorder, decorator) | Đọc input, gọi **service** đã khai trong `__init__` (hàm thì tạo ở đầu hàm) | Gọi repository/ORM, nghiệp vụ, `@transaction.atomic` |
| Service | Nghiệp vụ, transaction, kiểm tra quyền trên đối tượng, điều phối service khác | Gọi ORM trực tiếp (`Model.objects...`, `connection.cursor`) |
| Repository | **Duy nhất** truy cập DB (đọc + ghi), audit | Quy tắc nghiệp vụ |
| FilterSet (`filters/`) | Khai báo lọc theo field cho ViewSet (django-filter) | Nghiệp vụ, phân quyền |
| Serializer validate | Kiểm tra contract input | Truy vấn DB, gọi service |
| Serializer response | Chuyển object/dataclass → dict | Truy vấn DB, gọi service (dữ liệu phải được service/repository dựng sẵn, kể cả prefetch) |

- **Mọi điểm vào đều chỉ gọi service**, không riêng view. Điểm vào gồm: view, task (`tasks/`, `cleanup_tasks`),
  management command, signal receiver, recorder/adapter nối với core (`CORE_CHANGE_RECORDER`...), middleware,
  authentication class/backend, permission class, decorator. Các lớp này **không** gọi repository hay ORM
  (`XxxRepository()`, `Model.objects`), không chứa nghiệp vụ; nghiệp vụ và transaction nằm trong service.

  ```python
  # Sai: task gọi thẳng repository, tự giữ transaction và luật tính hạn
  @transaction.atomic
  def purge_expired_auth() -> int:
      buckets = RateLimitBucketRepository().delete_expired(now)
      return buckets + AuthSessionRepository().delete_expired_before(moment)

  # Đúng: task là lớp vỏ, gọi đúng một method của service
  def purge_expired_auth() -> int:
      """Task dọn phiên và bucket hết hạn (khai trong `cleanup_tasks`)."""
      return AuthCleanupService().purge_expired()
  ```

  Task/hàm không có `__init__` thì tạo service một lần ở đầu hàm rồi gọi; command/class khác tạo trong `__init__`.
- Không có lớp selector: đọc và ghi đều qua repository.
- Không gọi `Model.objects.filter(...).first()` ngoài repository; thêm method có tên vào repository
  (ví dụ `UserRepository.find_by_email`) và gọi qua service.
- Module khác chỉ dùng **service công khai** của nhau (ví dụ `utilities.QrCodeService` dùng `system.AttachmentService`),
  không import repository của module khác.

## 2. Cấu trúc module

```
app/<module>/
  apps.py  module.py  urls.py  signals.py (nếu có)
  permissions/<model>_permission.py         # Mỗi model 1 file permission riêng, kế thừa PermissionCatalog có name + description
  models/<model>.py  models/__init__.py     # __init__ import model để Django nạp
  repositories/<model>_repository.py        # kế thừa CoreRepository
  services/<model>_service.py               # mỗi model một service (+ service điều phối nếu cần)
  filters/<model>_filter.py                 # FilterSet cho ViewSet (nếu có lọc)
  serializers/validates/<resource>_<action>_validate_serializer.py
  serializers/responses/<resource>_<kind>_response_serializer.py   # mỗi endpoint một response
  views/<resource>_view_set.py              # CRUD trên model
  views/<resource>_view.py                  # XxxView (collection) + XxxObjectView (theo id): ngoại lệ 2 class
  schemas/  types/  utils/  decorators/  constants/  exceptions/   # chỉ tạo khi có
  tests/                                    # test của module: mỗi endpoint đúng 1 file riêng biệt
    test_<resource>_list_api.py             # danh sách: phân trang, tìm kiếm, lọc, sắp xếp, 401, 403
    test_<resource>_create_api.py           # tạo mới: full data, min data, validate, 401, 403
    test_<resource>_detail_api.py           # chi tiết: full data, owner isolation, 401, 403, 404
    test_<resource>_update_api.py           # sửa: full data, min/partial data, validate, owner, 401, 403, 404
    test_<resource>_delete_api.py           # xóa: soft delete, owner isolation, 401, 403, 404
    test_<resource>_bulk_delete_api.py      # xóa lô: quyền, owner, rollback transaction
    test_<resource>_<action>_api.py         # các endpoint tùy biến khác (import, resolve, toggle...)
    factories/                              # model factory phục vụ test
  migrations/
```

Tạo module: `uv run python manage.py startapp <m> app/<m>` rồi tổ chức như trên.

### 2.1 Khai báo module (mã module chỉ viết **một lần**)

```python
# app/utilities/apps.py
class UtilitiesConfig(CoreModuleConfig):
    """App Tiện ích."""

    default = True                      # bắt buộc (Django chọn đúng config trong apps.py)
    name = "app.utilities"
    label = "utilities"                 # = MODULE.code
    verbose_name = "Utilities"

# app/utilities/module.py
MODULE = ModuleDescriptor(code="utilities", ..., permissions=(*ShortLinkPermission.all(), *PagePermission.all()))
```

- `apps.py` kế thừa `CoreModuleConfig` (không dùng `AppConfig` trực tiếp): tự nạp `module.MODULE`,
  đăng ký vào registry và **bắt buộc `MODULE.code == label`** (sai → lỗi khi khởi động).
- Không viết `ready()` chỉ để đăng ký module. Cần thêm việc khi khởi động (signal, post_migrate,
  OpenAPI extension) thì override `ready()` và gọi `super().ready()` trước.
- Module đã cài luôn hoạt động: **không có** bảng cấu hình module, cờ bật/tắt runtime hay icon ở backend.
  Cách hiển thị module (nhóm, icon, thứ tự) do frontend khai tĩnh (`modules/manage-app`).
- `app/core/tests/test_module_conventions.py` kiểm tra: mọi app trong `app/` dùng `CoreModuleConfig`,
  đã đăng ký đúng mã, và mọi view của module kế thừa `CoreApiView`/`CoreModelViewSet`.

### 2.2 Mỗi class một file (bắt buộc, không ngoại lệ theo "tiện")

Mỗi file `.py` chỉ khai báo **đúng một class cấp module**, tên file là snake_case của tên class.

**Ngoại lệ (chỉ hai trường hợp):**

1. File APIView `views/<resource>_view.py` được chứa **đúng 2 class** `XxxView` (collection) và `XxxObjectView`
   (theo id) của cùng một tài nguyên. Không thêm class thứ ba (serializer, helper, view khác).
2. File model `models/<model>.py` được chứa class model **và enum của chính model đó** (`TextChoices`/
   `IntegerChoices` dùng cho field của model). Chỉ áp cho file model, không áp cho service, view, serializer...

**Class lồng được chấp nhận ở mọi loại file** (không tính là class thứ hai): `class Meta`, `class Config`, enum
lồng trong model (`class Status(models.TextChoices)` trong `ShortLink`), `Meta` của serializer/factory.

Chọn chỗ đặt enum của field model theo thứ tự:

| Trường hợp | Đặt ở đâu |
| --- | --- |
| Enum chỉ model đó dùng (mặc định) | **Lồng trong model**: `class ShortLink(CoreModel): class Status(models.TextChoices)`, gọi `ShortLink.Status.ACTIVE` |
| Muốn tên enum đứng riêng để import ngắn | Khai cạnh model, cùng file `models/<model>.py` (ngoại lệ 2), không tách file `models/<enum>.py` riêng |
| Nhiều model hoặc module khác cùng dùng | File riêng `constants/<enum>.py` |

```python
# models/auth_session.py
class AuthSession(CoreModel):
    class Status(models.TextChoices):
        """Trạng thái phiên đăng nhập."""

        ACTIVE = "ACTIVE", "Active"
        REVOKED = "REVOKED", "Revoked"

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
```

Các trường hợp hay bị gộp và chỗ đặt đúng:

| Đang gộp | Đặt đúng |
| --- | --- |
| Nhiều serializer trong một file (serializer chính + serializer con/lồng, delete/clear response...) | Mỗi serializer một file trong `serializers/validates/` hoặc `serializers/responses/`; serializer con dùng làm field cũng tách file riêng |
| Serializer khai báo ngay trong file view | Chuyển vào `serializers/validates/` / `serializers/responses/` |
| Enum của field model tách ra file riêng trong `models/` (`models/auth_session_status.py`, `models/role_auto_grant.py`) | Lồng vào model hoặc khai cạnh model trong `models/<model>.py` (bảng trên); `models/` chỉ chứa file model. Enum không gắn field model (`StrEnum` mã lỗi, hằng số) ở `constants/` |
| Enum/hằng số khai trong service, view, serializer | `constants/<tên>.py` (ngoại lệ 2 chỉ dành cho file model) |
| `@dataclass`/`TypedDict`/`NamedTuple`/`Protocol` khai báo trong service, validator, view | `types/<tên>.py` |
| Exception tự định nghĩa trong file service | `exceptions/<tên>.py` |
| Class giả/test double (`_View`, `FakeX`) trong file test | File riêng trong `tests/helpers/` (factory model vẫn ở `tests/factories/`) |

- Mỗi file test có đúng một class `TestXxx` (nếu dùng class); test dạng hàm không bị ràng buộc này.
- Hàm private (`_ten_ham`) được nằm cùng file với class khi chỉ file đó dùng; dùng chung từ hai file trở lên
  thì chuyển vào `utils/<tên>.py`.
- `app/core/tests/test_module_conventions.py` là nơi thêm kiểm tra tự động cho quy tắc này khi cần.

## 3. Core (`app/core`) — base duy nhất, module chỉ khai báo

Danh sách đầy đủ lớp nền, decorator, filter, exception, tiện ích và phần dùng chung của `system`:
[docs/common-catalog.md](../common-catalog.md) mục 1–3. Tra trước khi viết; thêm/đổi/xóa common thì cập nhật
danh mục cùng lần ([common.md](common.md) mục 3.3).

| Thành phần | Dùng khi |
| --- | --- |
| `models/core_model.py` | Mọi entity nghiệp vụ (UUID, timestamps, audit, soft delete tùy chọn) |
| `tracking/journal_tracker.py` | Mixin `JournalTracker`: model kế thừa (đặt **trước** `CoreModel`) thì CRUD tự ghi lịch sử thay đổi |
| `repositories/core_repository.py` | Gốc mọi repository: đọc (`get_queryset` tự ẩn bản đã xóa mềm, `get_queryset_with_deleted`, `get_by_id`, `find_one`, `exists`, `count`…), khóa dòng (`get_for_update`), ghi có audit (`create`, `update`, `update_where`, `bulk_create`), xóa mềm mặc định (`delete`, `delete_where`), xóa cứng tường minh (`hard_delete`, `hard_delete_where`) |
| `services/core_crud_service.py` | Gốc mọi service CRUD: owner (`owner_field`, `manage_all_permission`), quota (`owner_quota_setting`), `*_for(actor)`, `bulk_update`/`bulk_delete`, `log_event` |
| `views/core_api_view.py` | Gốc mọi API không phải CRUD: `get_actor(request)`; bảng override công khai/chỉ đăng nhập |
| `views/core_model_view_set.py` | Gốc mọi CRUD: list/retrieve/create/partial_update/destroy + action `bulk-update`, `bulk-delete`, `history` bật bằng thuộc tính |
| `permissions/` | `IsActiveAuthenticated`, `CsrfProtected` (quyền IAM: `system/permissions/has_iam_permission.py`) |
| `decorators/` | `validate_request` (input → `validated_data`), `rate_limit` (khóa `RATE_LIMITS` cho APIView) |
| `pagination/core_page_number_pagination.py` | Phân trang **chỉ khi request có `page`/`page_size`** (≤ 100); không có thì trả hết |
| `filters/*` | `CoreSearchFilter` (tìm **không dấu**: "nguyen" khớp "Nguyễn", qua `unaccent`; ≤ 100 ký tự, ≤ 5 từ) và bộ lọc nhiều giá trị `Core{Boolean,Choice,Char,UUID}InFilter` (≤ 50 giá trị) |
| `serializers/*` | `CoreValidateSerializer` (từ chối field lạ), bulk ids/result, `CoreJournalEntryResponseSerializer` |
| `utils/text.py` | Bỏ dấu ở Python: `to_ascii`, `ascii_slug` (thư viện `anyascii`). **Không tự viết bảng bỏ dấu**; tìm kiếm dùng `unaccent` của PostgreSQL |
| `schemas/*`, `responses/*`, `exceptions/*`, `registry/*`, `utils/{url,slug}.py` | Envelope OpenAPI/response, lỗi có mã, module registry, URL tuyệt đối/slug |

`app/core` **không import** các app nghiệp vụ khác (trừ `TYPE_CHECKING`). Core nối với module qua setting:
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
  Cho phép truyền vào để test. Không gọi `XxxService().method()` hay `XxxService.method()` (static/classmethod)
  giữa các method; mọi service/repository được dùng phải có mặt trong `__init__`.
- Method công khai của service là method thường (instance), không `@staticmethod`/`@classmethod`, để nơi gọi
  luôn đi qua instance đã khai trong `__init__` và thay được khi test. Hàm thuần không cần trạng thái thì đặt
  ở `utils/`. Module khác chỉ gọi **service công khai** (ví dụ `AttachmentService.find_alive_images`).
- Sự kiện không phải đổi field (gán vai trò…) ghi bằng `instance.journal_event("<module>.<event>", data, actor.pk)`;
  thay đổi dạng danh sách trước/sau dùng `changes={"roles": (cũ, mới)}` để trang Journal hiện cũ → mới.
- Đồng bộ một tập quan hệ (vai trò, quyền) làm **theo lô**: đọc hiện trạng một query, kiểm luật một lần cho cả
  nhóm, thêm bằng `bulk_create`, gỡ bằng một lệnh; số query không tăng theo số mục.
- Tác dụng phụ ra ngoài DB (gửi email, ghi/xóa file storage, gọi API ngoài) trong transaction phải chạy bằng
  `transaction.on_commit(...)`, để rollback thì không gửi/xóa nhầm.
- Không gọi query trong vòng lặp; cần dữ liệu liên quan thì `select_related`/`prefetch_related` hoặc một
  query theo lô ở repository.
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
    action_rate_limits = {"create": "utilities.short_link.create"}        # settings.RATE_LIMITS
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
- Đăng nhập `POST /system/auth/login` nhận `identifier` + `password`; sai thì một lỗi chung `AUTH_INVALID_CREDENTIALS`.
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
- **Mọi** service view dùng (kể cả service chỉ set/xóa cookie như `AuthCookieService`) tạo trong `__init__` của
  view, gọi qua `self.<tên>_service`. Trong method không có `XxxService().method()` hay `XxxService.method()`.

  ```python
  # Sai: AuthCookieService gọi thẳng bằng tên class trong post()
  AuthCookieService.clear_cookies(response)

  # Đúng
  def __init__(self, **kwargs: Any) -> None:
      super().__init__(**kwargs)
      self.auth_session_service = AuthSessionService()
      self.auth_cookie_service = AuthCookieService()
  ...
  self.auth_cookie_service.clear_cookies(response)
  ```
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
  `system` (nền: tài khoản, IAM, phiên, thư viện, journal, health) ← `novel`, `utilities`.
- Module nền không import module phụ thuộc nó. Cần hành vi chéo → dùng cơ chế chuẩn của Django:
  authentication backend (`User.has_perm` hỏi `IamPermissionBackend`), signal (`user_credentials_changed`).
- Dữ liệu của module khác không nhét vào response của module nền: vai trò lấy ở `GET /system/users/{id}/roles`,
  không nằm trong `/system/users`. API tổng hợp (ví dụ `/system/auth/me`) đặt ở module phụ thuộc cả hai.
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

- Mỗi model có một file permission riêng trong `permissions/<model>_permission.py` (kế thừa `PermissionCatalog`), không gộp chung các model vào một file. Mỗi quyền có dạng
  `PermissionDefinition(code="module.resource.action", name=..., description=...)`. Chỉ khai báo quyền của chức năng đã có API.
- `module.py`: gom các catalog quyền bằng `permissions=(*ModelAPermission.all(), *ModelBPermission.all(), ...)`.
- Vai trò mẫu chỉ gồm `ADMIN` và hai vai trò cho mỗi module (`<MÃ_MODULE>_MANAGER`: mọi quyền của module,
  `<MÃ_MODULE>_VIEWER`: chỉ quyền `read`), dựng từ module registry trong `RoleSeedService`; khai báo ở
  `system/constants/predefined_roles.py`. **Không** thêm vai trò nghiệp vụ tự đặt (tiếp thị, tác giả...) vào code.
  `ADMIN` (vai trò hệ thống duy nhất, `auto_grant=all`) được tạo sau mỗi `migrate` (post_migrate); vai trò theo
  module tạo bằng `uv run python manage.py seed_roles`. **Không** seed vai trò bằng data migration.
- Superuser bỏ qua kiểm tra quyền tầng ứng dụng (trừ `check`), không bỏ qua đăng nhập.

### Xoá và thao tác hàng loạt

- Xoá mặc định là **xoá mềm**: `CoreRepository.delete` / `delete_where`, `CoreCrudService.delete`, action
  `destroy` và `bulk-delete`. Có quyền `<module>.<resource>.delete` riêng. `get_queryset` gốc của repository tự ẩn
  bản đã xoá (lớp con gọi `super().get_queryset()`), nên bản ghi đã xoá biến mất khỏi API, đăng nhập và kiểm quyền.
- Xoá mềm **giải phóng giá trị unique**: `CoreModel.mark_deleted` thêm hậu tố `_deleted_<timestamp ms>` cho field
  text unique (`unique=True` hoặc trong `UniqueConstraint` không điều kiện, kể cả `Lower("slug")`), nên tạo lại cùng
  email/mã/slug được. Ràng buộc chỉ áp cho bản còn sống thì khai `condition=Q(deleted_at__isnull=True)`.
- Xoá cứng chỉ khi **thực sự cần** và gọi tường minh `hard_delete` / `hard_delete_where`, kèm một dòng chú thích lý
  do. Hiện có: dọn phiên/token/bucket hết hạn, dọn journal quá hạn giữ, gỡ gán vai trò/quyền (bảng nối, lịch sử
  đã ghi ở journal). Gọi `delete` trên model không có `deleted_at` → `TypeError` (không lặng lẽ xoá cứng).
- Thao tác hàng loạt là action có sẵn của `CoreModelViewSet` (mục 5.1); `CoreCrudService.bulk_*` gọi lại
  `update`/`delete` từng bản ghi trong **một transaction**: cùng luật nghiệp vụ, lỗi một dòng thì không dòng nào đổi.

## 10. Model, serializer, migration

- **Mọi field có thể khai báo `help_text` đều phải có** (model field, serializer field, filter):
  model field kèm `verbose_name` tiếng Việt và `db_comment`; đặt `db_table`.
- File/ảnh lưu qua Thư viện của module `system` (FK tới `system.Attachment`), không dùng URL tự do.
- Migration sinh bằng `makemigrations`; data migration tạo bằng `makemigrations <app> --empty --name ...`.
- Đổi kiểu cột không tương thích (ví dụ varchar → FK uuid) phải `RemoveField` + `AddField`.
- Không chạy migration khi cold start/request; chạy thủ công trước khi deploy.
- Migration phải tương thích ngược với bản code đang chạy: thêm cột mới cho phép null/có default trước, đổi
  code dùng cột mới, rồi mới xóa cột cũ ở lần sau (không đổi tên/xóa cột cùng lúc với code mới).
- Migration đã chạy trên môi trường dùng chung thì không sửa nội dung; cần đổi thì thêm migration mới.

## 11. Lỗi, log, bảo mật

- Raise `ValidationError`/`AuthorizationError`/`NotFoundError`/`ConflictError`/`BusinessRuleError`... kèm mã lỗi.
  Core chỉ giữ mã chung (`ErrorCode`); mã riêng nằm ở `app/<m>/constants/<m>_error_code.py` (StrEnum,
  tiền tố theo module, mã cũ đã phát hành giữ nguyên: xem [common.md](common.md) mục 6). `core/tests/test_error_codes.py`
  kiểm mã không trùng và FE có bản dịch vi/en cho mọi mã.
- Quy tắc kiểm tra riêng của module đặt trong module (`system/validators/password_validator.py`,
  `system/constants/role_code.py`); `CoreValidator` chỉ giữ định dạng dùng chung của core.
- Lỗi không lường trước để exception handler log + trả `INTERNAL_ERROR`.
- Request đổi trạng thái bằng cookie phải qua CSRF.
- Tên cookie, header, khóa setting, biến môi trường, claim JWT, khóa cache không có tiền tố `toannx` ở mọi dạng
  (`AUTH_ACCESS_COOKIE_NAME = "access_token"`, không `"toannx_access"`; không `TOANNX_*` trong `.env`)
  ([common.md](common.md) mục 3).
- Password chỉ qua `set_password`/validators của Django.

## 12. Test

- pytest + pytest-django trên PostgreSQL (`test_toannx`). Fixture chung ở `backend/conftest.py`.
- Base assertion: `app/core/tests/base/base_api_test_case.py`. Factory/helper IAM: `app/system/tests/`.
- **Nguyên tắc tổ chức test: Mỗi endpoint một file test riêng biệt** (`test_<resource>_<action>_api.py`).
  - Tuyệt đối **không gộp chung** toàn bộ action CRUD của một model vào một file `test_<model>_api.py`.
  - Tuyệt đối **không tách riêng** file kiểm tra quyền `test_<model>_permission.py`: kiểm tra phân quyền (401, 403, owner) là một phần của contract của endpoint đó và bắt buộc phải nằm trực tiếp trong file test của chính endpoint đó.
- **Yêu cầu bao phủ của mỗi file test endpoint**:
  - `full_data`: Thành công với payload đầy đủ tất cả các trường (required + optional + quan hệ liên kết), DB ghi đúng, response trả về đầy đủ.
  - `min_data`: Thành công với payload tối thiểu (chỉ các trường bắt buộc), các trường tùy chọn nhận giá trị mặc định / null hợp lệ.
  - `validation_errors`: Kiểm tra validation thất bại (thiếu trường bắt buộc, sai kiểu dữ liệu, vượt quá độ dài tối đa, trùng lặp unique slug/code/email, vi phạm quy tắc nghiệp vụ).
  - `unauthenticated`: Khách chưa đăng nhập gọi request nhận `401` `AUTH_UNAUTHENTICATED`.
  - `permission_denied`: Người dùng đã đăng nhập nhưng thiếu quyền nhận `403` `PERMISSION_DENIED`.
  - `owner_isolation`: Đối với endpoint làm việc trên đối tượng có owner (detail, update, delete):
    - Người dùng khác không được truy cập / chỉnh sửa (nhận `404` `NOT_FOUND` hoặc `403`).
    - Người dùng có quyền `manage_all` (hoặc superuser) được phép thao tác bình thường.
  - `response_structure`: Kiểm tra đúng cấu trúc envelope `{success: true, data: ..., meta: {request_id: ...}}`, status code chuẩn (200, 201, 204), không rò rỉ trường nhạy cảm (`password`, `secret`...).
  - `list_features` (cho endpoint danh sách): Tìm kiếm `search`, bộ lọc nhiều giá trị `Core*InFilter`, sắp xếp `ordering` (tăng/giảm), phân trang `page`/`page_size`, trang vượt quá trả `404`.
- Mỗi endpoint danh sách thêm một dòng vào `core/tests/test_list_query_count.py` (số query không tăng theo số bản ghi).
- `core/tests/test_endpoint_access.py` gọi thật **mọi** route: khách nhận 401, người không có quyền nhận 403
  `PERMISSION_DENIED`. View công khai / chỉ đăng nhập phải khai tên trong `PUBLIC_VIEWS` / `LOGIN_ONLY_VIEWS`.
- Test ghi file vào thư mục media tạm (fixture `_isolated_media`), không đụng `backend/media` của dev.
- Factory trong `tests/factories/` của module; model có `JournalTracker` test thêm lịch sử (`…/history`).

## 13. Công cụ

```bash
uv run ruff format <file> && uv run ruff check <file> && uv run mypy <file>        # file đã sửa
uv run pytest app/<m>/tests/test_<x>.py                                            # test liên quan
uv run ruff format . && uv run ruff check . && uv run mypy . && uv run pytest -q   # toàn bộ: chỉ khi được yêu cầu
uv run python manage.py spectacular --validate --fail-on-warn --file schema.yaml
```

Khi làm việc chỉ chạy phần liên quan tới chỗ sửa ([common.md](common.md) mục 7).
