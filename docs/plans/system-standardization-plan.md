# Chuẩn hóa hệ thống TOANNX — BE + FE

Ngày 15/11/2026 · bản 7. Thay cho `qr-shortlinks-custompages-plan.md` (bản 6) và file Q&A (đã gộp vào mục 13).
Trạng thái: **ĐÃ THỰC HIỆN** (15/11/2026) trên `develop`. Chưa làm: sinh type FE từ OpenAPI, CI workflow, CSP,
`SelectField` tìm kiếm bất đồng bộ + bộ lọc chủ sở hữu ở FE, node Tiptap `socialLinks`/`columns`, database E2E riêng,
cấu hình cron gọi `/health/cleanup` khi deploy.

Mục tiêu: dựng **base chuẩn** cho cả BE và FE ngay từ bây giờ. Sau khi xong, module mới (kể cả journal, QR, short
links, custom pages) chỉ **khai báo** theo base, không tự viết lại owner, bulk, quyền, rate limit, lịch sử thay đổi,
service CRUD, mutation, toast hay invalidate.

Cách đọc nhanh: mục 2 (thừa gì) → mục 3 (thiếu gì, lỗi tiềm ẩn) → mục 4–5 (base đích) → mục 11 (công thức thêm
module) → mục 12 (thứ tự làm) → mục 13 (quyết định cần bạn xem).

---

## 0. Nguyên tắc

1. **Base chỉ giữ thứ mọi module dùng chung.** Trường hợp khác thì ghi đè thuộc tính/method ngay trong lớp con, không
   sinh thêm lớp base. Một năm sau mở lại chỉ cần nhớ bảng ở 4.1 (BE) và 5.1 (FE).
2. **Khai báo thay vì viết code**: owner, bulk, quyền, rate limit, quota, lịch sử thay đổi đều là thuộc tính lớp.
3. **Mặc định an toàn**: không khai quyền = 403; không khai giới hạn = dùng giới hạn chung; không khai lịch sử = không
   ghi. Muốn mở rộng phải khai tường minh.
4. **Quyền = IAM + ownership.** `is_staff` chỉ cho vào khung quản trị FE; API không kiểm `is_staff`.
5. **Một nguồn sự thật**: luật nằm ở BE; FE chỉ ẩn/hiện và kiểm sớm cho trải nghiệm.
6. Mỗi bước một commit, test xanh sau mỗi bước; refactor không đi chung commit với tính năng mới.

---

## 1. Hiện trạng (đo ngày 15/11/2026)

| Hạng mục | Số liệu |
| --- | --- |
| BE `app/core` (không tính test) | 2.262 dòng, 17 thư mục |
| BE module | `attachment`, `account`, `iam`, `authentication`, `health`, `short_links`, `custom_pages` |
| BE view trong module | 40 (8 ViewSet, 32 APIView) |
| BE test | **195 passed** (`uv run pytest -q`) |
| BE test đếm query | 1 (chỉ `PermissionChecker`) |
| FE module | `account`, `iam`, `attachment`, `auth`, `manage-app`, `home` (chưa có FE cho short links, custom pages) |
| FE common | 37 thư mục `shares/components/common` |
| FE test | 49 unit, 42 e2e |
| CI | không có (chỉ git hook `commit-msg`, `pre-push`) |
| Working tree | khoảng 400 file chưa commit, gồm 2 module `short_links`, `custom_pages` chưa track |

Phần làm tốt, **giữ nguyên làm khuôn**: envelope response + `ErrorCode`, `CoreRepository` là lớp DB duy nhất có audit,
`CoreValidateSerializer` từ chối field lạ, bộ lọc nhiều giá trị `app/core/filters/*`, `PermissionChecker` cache theo
request, rate limit bằng bucket PostgreSQL, OpenAPI sạch; FE `apiClient` (CSRF, refresh single-flight, timeout),
`useTableState` đồng bộ URL, `DataTable`, bộ `FormPage`/`FormLayout`/`FormActions`, slot `extensions`.

---

## 2. Thừa — bỏ gì

### 2.1 Backend

| Thừa | Ở đâu | Thay bằng |
| --- | --- | --- |
| 7 lớp view nền chỉ khác 1 dòng `permission_classes` | `core/views/public_api_view.py`, `csrf_public_api_view.py`; `iam/views/authenticated_api_view.py`, `member_api_view.py`, `admin_api_view.py`, `admin_model_view_set.py`, `owned_model_view_set.py` | `CoreApiView` / `CoreModelViewSet` + bảng override 4.1 |
| `OwnedModelViewSet` chép lại 5 action của `CoreModelViewSet` | `iam/views/owned_model_view_set.py` | `CoreModelViewSet` luôn gọi bản `*_for(actor)` |
| Lọc owner viết 3 lần | `iam/services/owned_crud_service.py`, `AttachmentService`, `AttachmentFolderService` (`get_queryset_for`, `get_by_id_for`, `_can_access`) | `CoreCrudService.owner_field` (4.3) |
| Hai permission làm cùng một việc | `HasActionPermission` (ViewSet), `HasDeclaredPermission` (APIView) | `HasIamPermission` (4.2) |
| Kiểm `is_staff` ở API | `IsAdminArea`, `ErrorCode.ADMIN_ACCESS_REQUIRED`, 2 khóa dịch FE | bỏ |
| 8 view bulk + 8 dòng URL khai trước router | `*_bulk_update_view.py`, `*_bulk_delete_view.py` ở account, iam, attachment, authentication | action `bulk-update`/`bulk-delete` có sẵn trong `CoreModelViewSet` |
| 3 hàm bulk viết tay giống hệt | `UserService`, `RoleService`, `AttachmentService` `.bulk_update/.bulk_delete` | `CoreCrudService.bulk_*` |
| Kiểm `deleted_at` sau khi khóa dòng, lặp 6 nơi | `UserService.get_manageable_user`, `RoleService.get_editable_role`, `AttachmentService` ×2, `AttachmentFolderService`, `OwnedCrudService` ×2 | `CoreRepository.get_for_update` tự bỏ bản ghi đã xóa mềm (4.4) |
| Rate limit gọi tay trong service | `ShortLinkService.create`, `PageService.create`, `PageBlockService.add_block` (import `authentication`) | khai `action_rate_limits` trên view (4.5) |
| Mã lỗi của module nằm trong enum của core | `ACCOUNT_*`, `IAM_*`, `ATTACHMENT_*`, `SHORT_LINK_EXPIRED` trong `core/constants/error_codes.py` | mỗi module một enum riêng (4.6) |
| Method repository không ai dùng | `CoreRepository.get_one`, `get_by_ids` | xóa |
| Hai file util cùng chủ đề | `core/utils/url.py`, `core/utils/absolute_url.py` | gộp vào `url.py` |
| Block của Custom Pages | model `PageBlock`, repository, service, 3 view, 3 serializer, `CUSTOM_PAGE_BLOCK_CREATE_RATE_LIMIT`, `validators/page_content.py` | nội dung Tiptap JSON (mục 10) |
| Docs mô tả hành vi đã bỏ | `MODULE_DISABLED` trong `docs/reports/frontend-module-contract.md`; "tự gắn kiểm tra module" ở `docs/rules/backend.md` §3; nhắc `AdminApiView` trong docstring `require_permission.py` | sửa ở bước docs |

### 2.2 Frontend

| Thừa | Ở đâu | Thay bằng |
| --- | --- | --- |
| Mỗi service tự viết `list/get/create/update/remove/bulkSetActive/bulkRemove` | `user.service.ts`, `role.service.ts`, `attachment.service.ts`, `admin-auth-session.service.ts` | `createCrudService` (5.2) |
| Vòng lặp tải đủ trang viết 2 lần | `roleService.listAll`, `adminAuthSessionService.listUsers` | `fetchAllPages` |
| Handler mutation (toast + invalidate + lỗi) viết 6 bản | `useAccountMutationSuccess`, `useAccountBulkHandlers`, `useBulkDeleteUsers` tự viết lại, `useIamMutationHandlers`, `useIamDeleteHandlers`, attachment | `useResourceMutation` (5.3) |
| Endpoint bulk khai tay từng cái | `usersBulkUpdate`, `rolesBulkDelete`… trong `constants/api-endpoints.ts` | quy ước path cố định theo router BE |
| `shares/types/navigation.types.ts` liệt kê cứng mã module, href, `labelKey` | union `"account" \| "iam" \| "attachment"`, `"/admin/users" \| …` | suy kiểu từ `AppPathname`; nhãn lấy từ namespace của module (5.4) |
| `useDeleteAttachments` invalidate **toàn bộ** cache | `attachment/hooks/use-attachments.ts` | invalidate theo khóa đăng ký (5.3) |
| Phụ thuộc vòng giữa module | `auth → account, iam, manage-app, home` trong khi `account, iam → auth` | `auth` là nền, không import module khác (5.5) |

---

## 3. Thiếu và lỗi tiềm ẩn

Mức: **Cao** = có thể gây lỗi dữ liệu/bảo mật hoặc làm hỏng module mới; **Vừa** = hiệu năng/vận hành; **Thấp** = tiện
lợi, nhất quán.

### 3.1 Backend

| # | Vấn đề | Hậu quả | Mức | Sửa ở |
| --- | --- | --- | --- | --- |
| B1 | `CoreRepository.get_for_update` khóa trên `_default_manager` nên lấy cả bản ghi đã xóa mềm; `CoreCrudService.update/delete` không kiểm `deleted_at` | Service mới dùng base mà quên kiểm thì sửa/xóa được bản ghi đã xóa | Cao | 4.4 |
| B2 | `CoreModelViewSet.create` trả `service.get_by_id` không qua owner; `_validate` ném `NotImplementedError` | Mở method mà quên serializer → 500 lúc chạy | Vừa | 4.1 |
| B3 | Không có lịch sử thay đổi (journal) | Không truy được ai đổi gì, khi nào | Cao | 4.7, mục 7 |
| B4 | `update_where` (`QuerySet.update`) không cập nhật `updated_at`; `PageBlockService` phải tự truyền | Dữ liệu sắp xếp theo thời điểm sửa bị sai | Vừa | 4.4 |
| B5 | `drf.Throttled` không có trong `_DRF_ERRORS` → 429 nhưng mã `VALIDATION_ERROR` | FE dịch sai thông báo khi bật throttle | Thấp | 4.6 |
| B6 | Chỉ 1 test đếm query | N+1 lọt vào khi thêm field quan hệ vào serializer | Vừa | 4.8 |
| B7 | Không có giới hạn độ dài `search`, số giá trị của bộ lọc nhiều giá trị | Một request có thể sinh hàng trăm điều kiện `ILIKE`/`IN` | Vừa | 4.9 |
| B8 | Không có `statement_timeout`; `CONN_MAX_AGE=0` mặc định | Truy vấn treo giữ kết nối Neon; mỗi request mở kết nối mới | Vừa | 4.10 |
| B9 | `DATA_UPLOAD_MAX_MEMORY_SIZE` = cỡ file + 1 MB; Django **không** tính file vào giới hạn này | Body JSON được phép tới khoảng 6 MB | Vừa | 4.10 |
| B10 | Không có job dọn: bucket rate limit hết hạn, phiên/refresh token hết hạn, journal quá hạn | Bảng phình theo thời gian | Vừa | 4.11 |
| B11 | Không có quota theo owner (tổng số trang, link của mỗi người) | Rate limit theo giờ không chặn được tích lũy | Vừa | 4.5 |
| B12 | Factory test chỉ có ở account, iam | Test module mới tự dựng dữ liệu, mỗi nơi một kiểu | Thấp | 4.8 |
| B13 | Không có CI | Hook local có thể bị bỏ qua | Vừa | 12 |
| B14 | `has_audit()` gọi `_meta.get_fields()` mỗi lần ghi | Tốn CPU khi bulk | Thấp | 4.4 |
| B15 | Test e2e chạy trên DB dev | E2E sửa dữ liệu dev, kết quả phụ thuộc dữ liệu có sẵn | Vừa | 12 |

### 3.2 Frontend

| # | Vấn đề | Hậu quả | Mức | Sửa ở |
| --- | --- | --- | --- | --- |
| F1 | Thêm một module phải sửa 6 nơi rời (`routing.ts`, `messages.ts`, `global.d.ts`, `admin-navigation.ts`, `common.adminModules`, `navigation.types.ts`) | Quên một nơi là thiếu dịch/menu, chỉ phát hiện khi chạy | Cao | 5.4 |
| F2 | Kiểu dữ liệu API viết tay | Lệch với BE mà typecheck không bắt được | Vừa | 5.6 |
| F3 | Không có test khớp mã lỗi BE ↔ bản dịch FE | Mã mới hiện "Lỗi không xác định" | Vừa | 4.6 |
| F4 | `SelectField` chỉ có danh sách tải hết | Lọc theo chủ sở hữu (người dùng) phải tải toàn bộ user | Vừa | 5.7 |
| F5 | Không có dialog chứa form đầy đủ | Không làm được tạo/sửa nhanh tài nguyên liên quan (R3) | Vừa | 5.7 |
| F6 | `RichTextEditor` chỉ nhận/trả HTML, chèn ảnh bằng URL | Custom Pages cần JSON + ảnh từ Thư viện + ảnh QR | Vừa | 5.7 |
| F7 | Không có Content-Security-Policy | Trang công khai hiển thị nội dung người dùng soạn mà không có lớp chặn thứ hai | Vừa | 5.8 |
| F8 | Không có lint chặn phụ thuộc vòng/hướng phụ thuộc | Vòng `auth ↔ account` tái diễn | Thấp | 5.5 |
| F9 | Upload dùng chung timeout 15 giây | File 5 MB trên mạng chậm bị hủy | Thấp | 5.2 |

---

## 4. Base backend đích

### 4.1 View: 2 lớp + 1 bảng override

```
APIView        ─ CoreApiView        mọi API không phải CRUD (get_actor)
GenericViewSet ─ CoreModelViewSet   CRUD + bulk-update + bulk-delete + history (khai bằng thuộc tính)
```

Mặc định toàn hệ thống trong `config/settings.py` (lớp base **không** khai `permission_classes`):

```python
"DEFAULT_PERMISSION_CLASSES": [
    "app.core.permissions.is_active_authenticated.IsActiveAuthenticated",   # chuyển từ iam về core
    "app.modules.iam.permissions.has_iam_permission.HasIamPermission",
],
"DEFAULT_THROTTLE_CLASSES": [
    "app.modules.authentication.throttles.bucket_throttle.BucketThrottle",  # 4.5
],
```

| Trường hợp | Ghi đè trong view | Ví dụ |
| --- | --- | --- |
| Bình thường: đăng nhập + quyền IAM | **không**; APIView gắn `@require_permission`, ViewSet khai `action_permissions` | users, roles, links, pages, qr codes, journal |
| Chỉ cần đăng nhập | `permission_classes = [IsActiveAuthenticated]` | `/auth/me`, `/auth/sessions`, `/qr_codes/banks` |
| Công khai, chỉ đọc | `authentication_classes = []`, `permission_classes = [AllowAny]` | csrf, health, `/short_links/resolve/{slug}` |
| Công khai, đổi trạng thái bằng cookie | như trên + `CsrfProtected` | login, refresh, logout |
| Công khai nhưng biết ai đang xem | `permission_classes = [AllowAny]`, giữ xác thực, ghi đè `perform_authentication` (token hỏng = khách) | `/custom_pages/public/{segment}/{slug}` |

`CoreModelViewSet` khai bằng thuộc tính:

```python
class ShortLinkViewSet(CoreModelViewSet[ShortLink]):
    service_class = ShortLinkService
    filterset_class = ShortLinkFilter
    search_fields = ("name", "slug")
    ordering_fields = ("name", "created_at", "expires_at")
    list_serializer_class = ShortLinkListResponseSerializer
    detail_serializer_class = ShortLinkDetailResponseSerializer
    create_serializer_class = ShortLinkCreateValidateSerializer
    update_serializer_class = ShortLinkUpdateValidateSerializer
    bulk_update_serializer_class = ShortLinkBulkUpdateValidateSerializer   # None = không có bulk-update
    bulk_delete_enabled = True                                             # False = không có bulk-delete
    history_enabled = True                                                 # cần model có journal (4.7)
    action_permissions = {
        "list": permission_rule(P.READ), "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE), "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE), "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
    action_rate_limits = {"create": "short_links.create"}                  # 4.5
```

- Mọi action gọi `service.*_for(actor)` nên owner tự áp. `create` trả `get_by_id_for`.
- `get_extra_actions` ẩn `bulk_update`, `bulk_delete`, `history` khi không bật → router và OpenAPI không có endpoint thừa.
  `SimpleRouter` đặt list-route trước detail-route và `lookup_value_regex` là UUID nên `bulk-update` không bao giờ bị hiểu
  là `{pk}`. URL và tên route cũ **không đổi**.
- `__init_subclass__` kiểm khi import: mở `post` mà thiếu `create_serializer_class`, mở `patch` mà thiếu
  `update_serializer_class`, bật `history_enabled` mà model không có journal → lỗi lúc khởi động, không chờ request.
- Thao tác hàng loạt riêng (thu hồi phiên) là `@action` viết trong chính ViewSet đó.

### 4.2 Quyền

```python
class HasIamPermission(BasePermission):
    """ViewSet → action_permissions[view.action]; APIView → rule do @require_permission gắn trên handler.
    Không có rule → 403 PERMISSION_DENIED. Superuser qua (PermissionChecker)."""
```

`@require_permission` giữ nguyên (vẫn tự enforce trong wrapper, nên view ghi đè `permission_classes` vẫn được bảo vệ).
`PermissionChecker` cache theo user nên enforce hai lần không tốn query.

### 4.3 Service: `CoreCrudService` lo owner, quota, bulk, sự kiện

```python
class ShortLinkService(CoreCrudService[ShortLink, ShortLinkRepository]):
    repository_class = ShortLinkRepository
    owner_field = "owner"                                     # None = tài nguyên chung (users, roles, paths)
    manage_all_permission = ShortLinksPermission.MANAGE_ALL.code
    owner_quota_setting = "SHORT_LINK_MAX_PER_OWNER"          # None = không giới hạn tổng
```

| Method | Hành vi mặc định |
| --- | --- |
| `get_queryset_for(actor)` | Không có `owner_field` hoặc `actor.has_perm(manage_all)` → tất cả; ngược lại lọc `<owner_field>_id = actor.pk` |
| `get_by_id_for(actor, pk)` | Không thấy hoặc của người khác → `NotFoundError` (không lộ tồn tại) |
| `create(actor, data)` | Kiểm quota (khóa dòng user chủ trước khi đếm), gán owner = actor nếu có `owner_field` |
| `update(actor, pk, data)` | `get_for_update` (đã bỏ bản xóa mềm) → kiểm owner → `repository.update` |
| `delete(actor, pk)` | Như trên → xóa mềm nếu model hỗ trợ, ngược lại xóa cứng |
| `bulk_update(actor, ids, data)`, `bulk_delete(actor, ids)` | Một transaction, khóa theo thứ tự id (không deadlock), gọi lại `update`/`delete` từng bản ghi nên luật riêng của module tự áp |
| `log_event(actor, instance, event, data)` | Ghi sự kiện không phải đổi field (gán vai trò, thu hồi phiên) vào journal |

Dùng `actor.has_perm()` (Django gọi `IamPermissionBackend`) nên core **không import iam**, Attachment hết là ngoại lệ.

### 4.4 Repository

| Thay đổi | Lý do |
| --- | --- |
| `get_for_update(pk)` khóa `select_for_update(of=("self",))` trên queryset chưa xóa mềm (model có `deleted_at`) | B1; `of=("self",)` để không lỗi khi lớp con có `select_related` FK nullable |
| `update_where` tự thêm `updated_at = now()` khi model có field này | B4 |
| `has_audit()` cache theo lớp model | B14 |
| `create`, `update`, `soft_delete`, `hard_delete`, `update_where`, `bulk_create` gọi bộ ghi lịch sử (4.7) | Repository là lớp ghi duy nhất nên mọi đường ghi đều được bắt |
| Xóa `get_one`, `get_by_ids` | Không ai dùng |

### 4.5 Rate limit và quota khai báo

```python
# config/settings.py — một bảng duy nhất, đổi được bằng biến môi trường
RATE_LIMITS = {
    #  khóa                  (số lần, cửa sổ giây, theo)
    "default.write":        (env.int("RL_DEFAULT_WRITE", 300), 60, "user"),   # áp mọi POST/PATCH/DELETE không khai riêng
    "short_links.create":   (env.int("RL_SHORT_LINK_CREATE", 30), 3600, "user"),
    "custom_pages.create":  (env.int("RL_PAGE_CREATE", 20), 3600, "user"),
    "custom_pages.path.create": (env.int("RL_PAGE_PATH_CREATE", 10), 3600, "user"),
    "qr_codes.create":      (env.int("RL_QR_CREATE", 60), 3600, "user"),
    "qr_codes.preview":     (env.int("RL_QR_PREVIEW", 120), 60, "user"),
    "public.read":          (env.int("RL_PUBLIC_READ", 120), 60, "ip"),
}
```

- `BucketThrottle` (module authentication, dùng `RateLimitService` + bảng `auth_rate_limit_bucket` có sẵn) đọc
  `view.action_rate_limits[action]` (ViewSet) hoặc `@rate_limit("…")` trên method (APIView); không khai → `default.write`
  cho method ghi, không giới hạn cho GET đã đăng nhập. Vượt → 429 `RATE_LIMITED` + `Retry-After`.
- Rate limit đăng nhập/refresh giữ trong `AuthService` vì khóa theo identifier + IP, không theo user.
- Quota tổng theo owner khai ở service (`owner_quota_setting`), vượt → 409 `<MODULE>_QUOTA_EXCEEDED`.
- `short_links`, `custom_pages` không còn import `RateLimitService`.

### 4.6 Mã lỗi

- `app/modules/<m>/constants/<m>_error_code.py`: `class ShortLinksErrorCode(StrEnum)`. Core chỉ giữ mã chung
  (`VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `PERMISSION_DENIED`, `RATE_LIMITED`, `AUTH_*`…). `AppException.code`
  nhận `str`.
- Test BE `core/tests/test_error_codes.py`: gom mọi enum mã lỗi, kiểm không trùng giá trị, và đọc
  `frontend/src/messages/{vi,en}.json` để kiểm **mỗi mã có bản dịch** (F3). Một test, hai đầu khớp nhau.
- `exception_handler`: thêm `drf.Throttled → RATE_LIMITED` kèm `Retry-After` (B5).

### 4.7 Lịch sử thay đổi (journal) — model kế thừa tracker là chạy

```python
class ShortLink(JournalTracker, CoreModel):         # tracker là mixin, thêm vào lớp model
    journal_masked_fields = ("password_hash",)       # ghi "đã đổi" nhưng không lưu mã băm
```

- `JournalTracker` (`core/tracking/journal_tracker.py`) là mixin trừu tượng: model kế thừa thì CRUD qua repository **tự
  phát event** (CREATE/UPDATE/DELETE) và recorder lưu; model không kế thừa thì không ghi gì.
- Chi tiết một mục journal có `resource = "<module>.<model>"` (ví dụ `short_links.shortlink`); API nhật ký lọc nhiều giá
  trị theo `resource`.

| Thành phần | Ở đâu | Việc |
| --- | --- | --- |
| `journal_fields`, `journal_masked_fields` | thuộc tính lớp trên `CoreModel` (mặc định rỗng = không ghi) | Khai field cần theo dõi; `"__all__"` = mọi field trừ audit |
| `ChangeSet` | `core/tracking/change_set.py` | `action` (CREATE/UPDATE/DELETE/EVENT), `resource` (`short_links.shortlink`), `object_id`, `object_label`, `changes {field: [cũ, mới]}`, `event`, `actor`, `request_id` |
| `ChangeRecorder` | `core/tracking/change_recorder.py` | Hợp đồng: `record(change_sets)`, `list_for(resource, object_id, page)` |
| `get_change_recorder()` | `core/tracking/recorder_registry.py` | Nạp lớp từ setting `CORE_CHANGE_RECORDER` (giống `AUTHENTICATION_BACKENDS`); không cấu hình = không ghi. Core **không import** module journal |
| Gọi ghi | `CoreRepository` (4.4) | `update` đã tính `changed` → lấy giá trị cũ trước `setattr`; FK lưu `{id, label}`; `update_where` chạm field theo dõi thì đọc trước giá trị cũ của các dòng bị ảnh hưởng (một query) rồi ghi một lô |
| Thời điểm ghi | cùng transaction với thay đổi | Rollback thì lịch sử cũng mất, không có lịch sử "ma" |

Chi tiết module journal ở mục 7.

### 4.8 Test base

| Thêm | Việc |
| --- | --- |
| Fixture `assert_list_query_count(url, factory)` trong `conftest.py` | Tạo 1 bản ghi đo số query, tạo thêm 20 bản ghi đo lại, hai số phải bằng nhau (chặn N+1, B6). Bắt buộc cho mọi endpoint danh sách |
| `tests/factories/` ở **mọi** module | Factory cho mọi model nghiệp vụ (B12) |
| `test_module_conventions.py` thêm ca | Mọi action mở trong `http_method_names` của ViewSet có rule trong `action_permissions`; mọi view ghi đè `permission_classes` nằm trong danh sách được phép (bảng 4.1); mọi model có `journal_fields` chỉ khai field tồn tại |
| `core/tests/test_core_crud_service.py` | owner None / owner / manage_all / quota / bulk rollback / bản ghi đã xóa mềm → 404 |
| `iam/tests/test_has_iam_permission.py` | ViewSet thiếu rule → 403; APIView thiếu decorator → 403; superuser qua; non-staff có quyền → 200 |

### 4.9 Giới hạn đầu vào chung

| Giới hạn | Giá trị | Ở đâu |
| --- | --- | --- |
| Phân trang | **Chỉ khi request có `page` hoặc `page_size`**; không truyền thì trả hết (danh mục, ô chọn). `page_size` ≤ 100 | `CorePageNumberPagination` |
| Id mỗi lần bulk | ≤ 100 (đã có) | `CoreBulkIdsValidateSerializer` |
| `search` | ≤ 100 ký tự, ≤ 5 từ | `CoreSearchFilter` mới (thay `SearchFilter` trong settings), vượt → 400 |
| Giá trị mỗi bộ lọc nhiều giá trị | ≤ 50 | `Core*InFilter`, vượt → 400 |
| `ordering` | chỉ field trong `ordering_fields` (đã có) | DRF |
| Body JSON | ≤ 1 MB | `DATA_UPLOAD_MAX_MEMORY_SIZE` (B9); file theo `ATTACHMENT_MAX_SIZE_BYTES` |
| Nội dung một trang | ≤ 256 KB, ≤ 30 ảnh, ≤ 10 video | validator Custom Pages |

### 4.10 Kết nối và truy vấn

- `DATABASES["default"]["OPTIONS"]["options"] = "-c statement_timeout=5000"` (đổi bằng biến môi trường) (B8).
- Production dùng host **pooler** của Neon; `CONN_MAX_AGE` giữ 0 trên Vercel, bật `CONN_HEALTH_CHECKS`. Ghi vào
  `docs/deployment.md`.
- Index chuẩn cho model có owner và xóa mềm: `Index(fields=["owner", "-created_at"], condition=Q(deleted_at__isnull=True))`.
  Tìm kiếm `ILIKE` chỉ thêm index trigram khi bảng vượt khoảng 10.000 dòng; ghi điều kiện này vào rule, không làm trước.

### 4.11 Dọn dữ liệu định kỳ

- `ModuleDescriptor.cleanup_tasks: tuple[str, ...]` (đường dẫn hàm). Lệnh chung `uv run python manage.py run_cleanup`
  chạy mọi task đã đăng ký.
- Task: authentication xóa bucket rate limit hết hạn, phiên/refresh token hết hạn quá 30 ngày; journal xóa mục cũ hơn
  `JOURNAL_RETENTION_DAYS` (mặc định 365).
- Chạy hằng ngày bằng Vercel Cron gọi `POST /api/v1/health/cleanup`, chặn bằng header `CRON_SECRET` (13 · D6).

---

## 5. Base frontend đích

### 5.1 Luồng giữ nguyên, phần lặp đưa vào base

```
page.tsx → View → component (+hook riêng) → hook module (mỏng) → service (createCrudService + phần riêng) → apiClient
```

| Muốn | Dùng base | Module chỉ khai |
| --- | --- | --- |
| Gọi API CRUD | `createCrudService` | endpoint gốc + kiểu + method riêng |
| Query danh sách/chi tiết | `useListQuery`, `useDetailQuery` | query key + service |
| Ghi dữ liệu | `useResourceMutation` | `mutationFn`, khóa cần làm mới, loại thông báo |
| Bảng | `useTableState` + `DataTable` (đã có) | cột, bộ lọc |
| Form | `FormPage` + `FormLayout` + `FormActions` (đã có) + `FormDialog` (mới) | schema, trường |
| Lịch sử thay đổi | `RecordHistory` của module journal, cắm qua slot | endpoint `…/{id}/history`, nhãn field |

### 5.2 `createCrudService` và quy ước path

```ts
// shares/lib/api/create-crud-service.ts — path theo router BE: base, base/{id}, base/bulk-update, base/bulk-delete, base/{id}/history
export const shortLinkService = {
  ...createCrudService<ShortLink, ShortLinkFilters, ShortLinkInput>(SHORT_LINKS_API_ENDPOINTS.links),
  // chỉ thêm method riêng của tài nguyên ở đây
};
// có sẵn: list, listAll (fetchAllPages), get, create, update, remove, bulkUpdate(ids, patch), bulkRemove(ids), history(id, page)
```

- `fetchAllPages` dùng chung cho danh mục (thay 2 vòng lặp viết tay).
- `RequestOptions.timeoutMs` cho từng request; upload dùng 60 giây (F9).
- Service vẫn **một file một model BE** đúng rule; factory chỉ bỏ phần lặp.

### 5.3 Hook dùng chung

```ts
// shares/hooks/use-resource-mutation.ts
useResourceMutation({
  mutationFn: (ids: string[]) => shortLinkService.bulkRemove(ids),
  invalidate: [shortLinkKeys.all],          // bắt buộc khai; không còn invalidate toàn bộ cache
  success: "bulkDeleted",                   // "saved" | "deleted" | "bulkUpdated" | "bulkDeleted" | false
  toastError: true,                         // form tự hiện lỗi field thì đặt false
});
```

- `createResourceKeys("short-links", "links")` sinh `{ all, list(f), detail(id), history(id) }` cho mọi module.
- Module nền (Attachment) bị nhiều module tham chiếu: khóa `attachmentKeys.all` + tag `["attachment-refs"]`; module nào
  hiển thị ảnh thì thêm tag này vào query key của mình. Hết `invalidateQueries()` toàn bộ.

### 5.4 Đăng ký module: một danh sách + một test

- Mỗi module FE có `src/modules/<m>/module.ts`: `code`, `PATHNAMES`, `navigation` (nếu có), `messages` (loader theo
  locale). `routing.ts`, `messages.ts`, `global.d.ts`, `admin-navigation.ts` chỉ còn **ghép từ danh sách này** (spread
  tường minh để giữ kiểu URL).
- `shares/types/navigation.types.ts` bỏ union cứng: `href: AppPathname`, `module: string`, nhãn menu và tên module lấy
  từ namespace của chính module (`<m>.nav.*`, `<m>.module.name`), không còn trong `common.adminModules`/`common.nav`.
- Test `tests/unit/module-registry.test.ts`: mọi thư mục trong `src/modules` có `module.ts` và có mặt ở routing, messages,
  global.d.ts; mọi module có `navigation` đều ở `ADMIN_MODULE_NAVIGATION`; vi/en đủ khóa (đã có test messages). Quên
  một chỗ là test đỏ (F1).

### 5.5 Hướng phụ thuộc

```
shares  ←  auth  ←  attachment  ←  account  ←  iam  ←  journal  ←  short-links, qr-codes, custom-pages  ←  manage-app, home
```

- `auth` là nền phía FE (người dùng hiện tại, `usePermission`, `PermissionGate`): **không import** module khác. Kiểu
  `CurrentUser` khai trong `auth`; đích chuyển hướng sau đăng nhập do page truyền vào.
- Lint: `eslint-plugin-boundaries` khai đúng chiều trên; `shares` không import `modules` (đã có, chuyển thành rule lint).

### 5.6 Kiểu API sinh từ OpenAPI

- `pnpm gen:api` chạy `openapi-typescript` trên schema BE → `src/shares/types/openapi.d.ts` (commit vào repo).
- `types/<m>.types.ts` của module khai bằng alias từ kiểu sinh ra rồi đổi camelCase bằng một kiểu tiện ích `Camelize<T>`.
- Bước `check-all` chạy lại `gen:api` và báo lỗi nếu file khác bản đã commit (F2).

### 5.7 Common mới

| Common | Việc | Ai dùng |
| --- | --- | --- |
| `select-field` thêm chế độ `loadOptions(search, page)` | Ô chọn tìm phía server, tải dần (F4) | chọn chủ sở hữu, chọn link rút gọn, chọn mã QR |
| `form-dialog/` | Dialog chứa đúng form đầy đủ của tài nguyên; `FormActions` portal vào chân dialog (F5) | tạo/sửa nhanh Đường dẫn giữa, Link rút gọn |
| `SelectField` thêm `onCreate`, `onEdit` | Dòng cuối `+ Tạo …`, nút `✎` cạnh giá trị đang chọn | như trên |
| `activity-timeline/` | Danh sách sự kiện: người làm, thời điểm, field cũ → mới (chỉ hiển thị) | `RecordHistory` của journal |
| `tiptap-editor/` (thay và **xóa** `rich-text-editor`, vốn chỉ nhận HTML và không module nào dùng) | Editor Tiptap duy nhất của hệ thống: giá trị là **JSON Tiptap**, nhận `extensions` và mục chèn từ ngoài, chọn ảnh trả `{src, alt, attachmentId}` (F6). Mọi trường soạn thảo dùng component này | custom-pages; nút "Chèn mã QR" do module QR cắm vào |

### 5.8 Bảo mật trình duyệt

- CSP đặt trong `next.config.ts` (F7): `default-src 'self'`; `img-src 'self' https: data:` (ảnh ngoài theo Q6);
  `frame-src https://www.youtube-nocookie.com`; `script-src 'self'` + nonce do `proxy.ts` cấp; `object-src 'none'`;
  `base-uri 'self'`. Bật dạng `Report-Only` một vòng trước khi chặn thật.

### 5.9 Hiệu năng FE

| Việc | Giá trị |
| --- | --- |
| `staleTime` mặc định | 30 giây (đã có); danh mục tĩnh (quyền, ngân hàng) `Infinity` |
| Danh sách | `placeholderData: keepPreviousData` (đã có, đưa vào `useListQuery`) |
| Editor Tiptap | `next/dynamic` chỉ nạp ở trang soạn, không vào bundle chung |
| Trang công khai | SSR; BE trả `Cache-Control: public, max-age=60` cho trang đã công khai, `private, no-store` cho bản nháp |

---

## 6. Bảng giới hạn chuẩn (một chỗ để tra)

| Nhóm | Giới hạn | Mặc định | Đổi bằng |
| --- | --- | --- | --- |
| Danh sách | phân trang khi có `page`/`page_size`, không có thì trả hết; `page_size` tối đa | 100 | code |
| Danh sách | `search` | 100 ký tự, 5 từ | code |
| Danh sách | giá trị mỗi bộ lọc | 50 | code |
| Bulk | id mỗi lần | 100 | code |
| Body | JSON | 1 MB | `DATA_UPLOAD_MAX_MEMORY_SIZE` |
| Body | file | 5 MB | `ATTACHMENT_MAX_SIZE_BYTES` |
| DB | thời gian một câu truy vấn | 5 giây | `DB_STATEMENT_TIMEOUT_MS` |
| Ghi | mọi POST/PATCH/DELETE không khai riêng | 300/phút/user | `RL_DEFAULT_WRITE` |
| Tạo | link rút gọn · trang · đường dẫn giữa · mã QR | 30 · 20 · 10 · 60 mỗi giờ/user | `RL_*` |
| Xem trước QR | | 120/phút/user | `RL_QR_PREVIEW` |
| Công khai | resolve link, xem trang | 120/phút/IP | `RL_PUBLIC_READ` |
| Quota | trang · link rút gọn · mã QR mỗi owner | 50 · 500 · 200 | `*_MAX_PER_OWNER` |
| Trang | nội dung · ảnh · video | 256 KB · 30 · 10 | `CUSTOM_PAGE_*` |
| Journal | lưu | 365 ngày | `JOURNAL_RETENTION_DAYS` |
| FE | timeout request · upload | 15 giây · 60 giây | `env.ts` |

---

## 7. Module Journal (`journal` BE · `journal` FE)

### 7.1 Database `journal_entry` (chỉ thêm, không sửa, không xóa mềm)

| Cột | Kiểu | Ghi chú |
| --- | --- | --- |
| `id` | UUID | |
| `created_at` | timestamptz | |
| `actor` | FK user, `SET_NULL` | null = hệ thống (migration, lệnh) |
| `actor_label` | varchar(254) | email lúc ghi, để vẫn đọc được khi user bị xóa |
| `request_id` | varchar(64) | khớp log |
| `resource` | varchar(100) | `app_label.model`, ví dụ `account.user` |
| `object_id` | UUID | |
| `object_label` | varchar(200) | `str(instance)` lúc ghi |
| `action` | varchar(10) | `CREATE`, `UPDATE`, `DELETE`, `EVENT` |
| `event` | varchar(64), null | mã sự kiện khi `action = EVENT` (`iam.role_assigned`) |
| `changes` | jsonb | `{field: [cũ, mới]}`; field ẩn ghi `["***", "***"]` |

Index: `(resource, object_id, created_at DESC)`, `(actor, created_at DESC)`, `(created_at)` cho dọn dữ liệu.

### 7.2 Ghi

- `JournalRecorder` (`journal/recorders/journal_recorder.py`) thực thi `ChangeRecorder`; settings
  `CORE_CHANGE_RECORDER = "app.modules.journal.recorders.journal_recorder.JournalRecorder"`.
- Một lần gọi repository = một `INSERT` (bulk). Không có thay đổi thực sự thì không ghi.
- Bật ngay cho: `User` (trừ `password` ẩn, `last_login`, `last_seen_at` không theo dõi), `Role`, `Attachment`
  (`original_name`, `folder`), `AttachmentFolder`, `ShortLink`, `PagePath`, `Page` (trừ `content`: chỉ ghi "đã đổi nội
  dung" để không phình bảng), `QrCode`. Sự kiện: gán/gỡ vai trò, gán/gỡ quyền, thu hồi phiên.

### 7.3 Đọc

| Method | Endpoint | Quyền | Ghi chú |
| --- | --- | --- | --- |
| GET | `/<resource>/{id}/history` | rule `history` của ViewSet (thường = quyền đọc) | action core; quyền owner tự áp qua `get_by_id_for` |
| GET | `/journal/entries?resource=&object_id=&actor=&action=&created_from=&created_to=` | `journal.entry.read` | nhật ký toàn hệ thống cho quản trị; bộ lọc nhiều giá trị |

Quyền mới: `journal.entry.read`.

### 7.4 FE

- Component `RecordHistory({ path, fieldLabels })` (module journal) dùng common `ActivityTimeline`; page cắm vào cột phụ
  của form chi tiết qua slot, giống cách IAM cắm vai trò vào form User. Module nghiệp vụ không import journal.
- Nhãn field lấy từ `<m>.fields.*` của module (chuẩn mới: mỗi module khai nhãn field một lần, form và lịch sử dùng chung).
- Trang **Nhật ký** trong nhóm Hệ thống: `DataTable` với lọc tài nguyên, người làm, hành động, khoảng thời gian.

---

## 8. Module Mã QR (`qr_codes` BE · `qr-codes` FE)

QR là **công cụ riêng có trang quản lý**. Mỗi mã QR sinh ra một **ảnh trong Thư viện**. Custom Pages (và mọi nơi khác)
chỉ chèn ảnh đó.

### 8.1 Database `qr_code`

| Cột | Ghi chú |
| --- | --- |
| `owner` | FK user, `PROTECT` |
| `name` | 150 |
| `qr_type` | `BANK_TRANSFER`, `URL`, `TEXT` |
| `data` | JSON theo loại: chuyển khoản `{bank_bin, account_number, account_name, amount?, message?}`; URL `{url}`; văn bản `{text ≤ 1000}` |
| `payload` | chuỗi mã hóa (VietQR EMVCo + CRC16 với chuyển khoản), BE dựng khi lưu |
| `style` | `{size 128–1024, foreground, background, margin 0–8, error_correction L/M/Q/H}` |
| `image` | FK Attachment (PNG do BE sinh), `PROTECT` |
| `logo` | FK Attachment tùy chọn; ảnh raster dùng để ghép giữa mã QR |

Index `(owner, -created_at) WHERE deleted_at IS NULL`. `journal_fields = ("name", "qr_type", "data", "style")`.

### 8.2 Nghiệp vụ

- Dựng payload chuyển khoản và CRC bằng thư viện `napas-qr-python` qua
  `qr_codes/utils/vietqr_payload.py`; vẽ ảnh PNG/SVG bằng `segno`. Không tự ghép TLV hoặc tính CRC.
- Logo tùy chọn lấy từ Attachment ảnh raster mà người dùng được phép đọc; dùng Pillow ghép vào tâm mã ở kích thước
  giới hạn, đặt mức sửa lỗi H và lề ít nhất 4 ô. Ảnh PNG lưu và SVG xem trước/tải xuống đều có logo.
- `AttachmentService` thêm hai method công khai: `create_generated(actor, owner, content, name)` và
  `replace_content(attachment, content)`. Sửa mã QR → **thay nội dung ngay trong attachment cũ** (giữ id), nên trang nào
  đã chèn ảnh này tự hiện mã mới (13 · D3).
- Xóa mã QR → xóa mềm cả attachment; trang công khai bỏ ảnh không còn (như ảnh bị xóa ở Thư viện).
- Quy tắc chuyển khoản (Q7): nội dung ≤ 25 ký tự không dấu; tên chủ tài khoản bắt buộc, tự in hoa + bỏ dấu; danh mục ngân
  hàng khai tĩnh; chưa làm ví điện tử.
- Loại URL: FE cho chọn nhanh link rút gọn của chính mình (ô chọn tìm phía server); BE chỉ lưu URL, **không** phụ thuộc
  module short_links.

### 8.3 API

| Method | Endpoint | Quyền |
| --- | --- | --- |
| GET/POST | `/qr_codes/codes` | `qr_codes.code.read` / `create` |
| GET/PATCH/DELETE | `/qr_codes/codes/{id}` | `read` / `update` / `delete` |
| POST | `/qr_codes/codes/bulk-delete` | `delete` |
| GET | `/qr_codes/codes/{id}/history` | `read` |
| POST | `/qr_codes/preview` `{qr_type, data, style}` → `{payload, svg}` | `create` hoặc `update`; không ghi DB |
| GET | `/qr_codes/banks` | chỉ đăng nhập |

Quyền mới: `qr_codes.code.{read,create,update,delete,manage_all}`.

### 8.4 FE

- Route: `/vi/quan-tri/ma-qr` (+ `/tao-moi`, `/[id]`) · `/en/admin/qr-codes`. Nhóm launcher **Tiện ích**.
- Bảng: ảnh nhỏ, Tên, Loại, Cập nhật, ⋯ (Sửa, Sao chép, Tải PNG, Xóa).
- Form một trang cho tạo/sửa: cột chính là loại + dữ liệu theo loại; cột phụ là **xem trước trực tiếp** (gọi
  `/preview` sau 300 ms ngừng gõ, hiển thị SVG từ BE nên FE không cần thư viện vẽ QR), kiểu dáng, nút Tải PNG/SVG.
- `QrCodePicker` (dialog chọn mã QR của mình) cắm vào editor của Custom Pages qua slot: chọn xong chèn node ảnh
  `{src, alt, attachmentId}`.

```
┌ "Mã QR · Ủng hộ ToanNX"                                        [Hủy] [Lưu] ┐
├ Loại *     (●) Chuyển khoản  ( ) Liên kết  ( ) Văn bản        ┌ Xem trước ─────┐
├ Ngân hàng * [ Vietcombank ▾ ]                                 │   ▓▓░░▓▓░▓▓    │
├ Số TK *    [ 0123456789 ]     Chủ TK * [ NGUYEN XUAN TOAN ]   │   ░▓▓░░▓░░▓    │
├ Số tiền    [ 50.000 ₫ ]       Nội dung [ ung ho toannx ]      │   ▓░▓▓░▓▓░▓    │
└ Kiểu dáng: Kích thước [512] · Màu [■][□] · Lề [2] · Mức sửa lỗi [M ▾]  [PNG][SVG] ┘
```

---

## 9. Short Links

Module đã chuyển sang base CRUD với owner, `manage_all`, bulk, history và rate limit. Slug duy nhất theo
`Lower(slug)` (bản đã xóa không dùng lại); URL đích nội bộ `/s/…` bị chặn. `status=EXPIRED` được suy từ
`expires_at`; link hết hạn trả 410.

`/s/{slug}` là trang trung gian. Người xem bấm mở URL đích hoặc chờ tự mở sau 1–60 giây nếu chủ link cấu hình.
Link có thể không hết hạn hoặc có thời điểm hết hạn; link hết hạn hiện thông báo ngay tại URL ngắn. Mật khẩu
link được băm, đổi/bỏ bởi chủ sở hữu hoặc người có quyền `UPDATE` và `MANAGE_ALL`, không lộ URL đích qua API công
khai trước khi mở khóa. Slug bỏ trống được tạo bằng UUID; form có nút tạo UUID và xem trước trang trung gian.
Migration `short_links/0003` thay `redirect_type` bằng `auto_redirect_seconds` và `password_hash`.

---

## 10. Custom Pages

### 10.1 Khái niệm

```
toannx.com / qr / donate
             │    └─ slug của trang (Page.slug, 3–64)
             └─ đường dẫn giữa (PagePath.segment, 1–32): danh mục chung, ai có quyền thì tạo thêm
```

### 10.2 Database

- `custom_page_path` (mới): `segment` (unique `Lower`, chặn đoạn dành riêng `PUBLIC_RESERVED_SEGMENTS` trong settings),
  `name`, `description`, `is_active`, `position`. Không owner. Seed `p` (Trang), `qr` (Mã QR). Còn trang thì không xóa
  được (409).
- `custom_page` (sửa): thêm `path` (FK PROTECT), `content` (JSON Tiptap), `content_version`, `published_at`; unique
  `(path, Lower(slug))`.
- Bỏ `custom_page_block`. Migration `0002` chuyển block cũ sang JSON và gán trang cũ vào `p`.

### 10.3 Nội dung Tiptap

| Chèn được | Ghi chú |
| --- | --- |
| Chữ: đoạn, heading 1–3, đậm/nghiêng/gạch chân/gạch ngang, code, link, highlight, màu chữ, căn lề | link: `http`, `https`, `mailto`, `tel` |
| Khối: danh sách, việc cần làm, trích dẫn, code block, đường kẻ | |
| Bảng | ≤ 20 cột, ≤ 100 dòng |
| **Ảnh** `{src, alt, attachmentId?}` | từ Thư viện, **mã QR** (qua `QrCodePicker`, bản chất là ảnh trong Thư viện), hoặc URL ngoài `https` |
| Video | chỉ YouTube (`nocookie`) |
| Node riêng: `button` (link thường hoặc link rút gọn của chủ trang), `columns` 2–3, `callout`, `socialLinks`, `spacer` | **không có node QR** |

- BE kiểm khi lưu (`custom_pages/validators/page_content_validator.py`): chỉ node/mark/attr trong bảng, sai → 400 kèm vị
  trí node; ảnh có `attachmentId` phải là ảnh của **chủ trang**; link rút gọn phải của chủ trang; giới hạn ở mục 6.
- Trả public: ảnh có `attachmentId` → URL hiện tại của attachment (mã QR sửa xong tự cập nhật); attachment đã xóa → bỏ
  node; link rút gọn tắt/hết hạn/xóa → bỏ nút; trang vẫn 200.

### 10.4 API

| Method | Endpoint | Quyền |
| --- | --- | --- |
| GET/POST, GET/PATCH/DELETE | `/custom_pages/paths`, `/custom_pages/paths/{id}` | `custom_pages.path.*` (mới) |
| GET/POST, GET/PATCH/DELETE | `/custom_pages/pages`, `/custom_pages/pages/{id}` | `custom_pages.page.*`; PATCH bắt buộc `content_version`, lệch → 409 |
| POST | `/custom_pages/pages/bulk-update` (`status`) · `/bulk-delete` | `update` / `delete` |
| POST | `/custom_pages/pages/{id}/duplicate` | `create` |
| GET | `/custom_pages/pages/{id}/history`, `/custom_pages/paths/{id}/history` | `read` |
| GET | `/custom_pages/public/{segment}/{slug}` | công khai (dòng 5 bảng 4.1) |

Public: `PUBLISHED` → 200; chưa công khai mà người xem đọc được trang theo luật API quản lý → 200 + `preview: true`,
`private, no-store`, `noindex`; còn lại 404 giống hệt nhau. Bỏ API block, bỏ `qr-preview`/`qr-banks` khỏi module này.

### 10.5 FE

Như bản 6, sửa theo QR mới:

- Danh sách: Tên + URL, Đường dẫn giữa, Trạng thái, Cập nhật; lọc đường dẫn giữa, trạng thái, chủ sở hữu (khi có
  `manage_all`); bulk Công khai / Ngừng công khai / Xóa; ⋯ Sửa · Nhân bản · Xem · Xóa.
- Tạo: Đường dẫn giữa (có `+ Tạo…` và `✎` mở `FormDialog`), Slug, Tiêu đề, Mô tả, Bắt đầu từ (Trống, Link-in-bio, Giới
  thiệu, Ủng hộ — mẫu Ủng hộ mở `QrCodePicker` ngay sau khi tạo).
- Soạn: tab Nội dung | Giao diện | SEO | Cài đặt; toolbar có **Ảnh** và **Mã QR**; Lưu một lần kèm `content_version`;
  bản chưa lưu giữ tạm trong trình duyệt; có `read` không có `update` → chỉ xem; cột phụ có Lịch sử thay đổi.
- Xem: SSR; bản nháp hiện toast "Chỉ người có quyền mới xem được" (+ Sửa trang nếu có quyền).
- Route: `/vi/quan-tri/trang`, `/vi/quan-tri/duong-dan`; trang công khai `toannx.com/{segment}/{slug}` qua rewrite trong
  `proxy.ts` sang route nội bộ `app/[locale]/(public)/_trang/[segment]/[slug]`.

---

## 11. Công thức thêm module mới (sau chuẩn hóa)

### 11.1 Backend — chỉ khai báo

1. `manage.py startapp`, `apps.py` kế thừa `CoreModuleConfig`, `module.py` khai `ModuleDescriptor` (quyền, phụ thuộc,
   `cleanup_tasks` nếu có).
2. `permissions/<m>_permission.py`, `constants/<m>_error_code.py` (+ bản dịch FE, test 4.6 bắt nếu thiếu).
3. Model kế thừa `CoreModel`; khai `journal_fields`; index owner có điều kiện xóa mềm.
4. Repository kế thừa `CoreRepository`, chỉ ghi đè `get_queryset` (`select_related`/`prefetch_related` đủ cho serializer).
5. Service kế thừa `CoreCrudService`: `owner_field`, `manage_all_permission`, `owner_quota_setting`; chỉ ghi đè
   `create`/`update`/`delete` khi có luật nghiệp vụ.
6. ViewSet kế thừa `CoreModelViewSet`: serializer, filter, `bulk_*`, `history_enabled`, `action_permissions`,
   `action_rate_limits`. API khác: `CoreApiView` + `@require_permission` (+ ghi đè theo bảng 4.1 nếu công khai).
7. Test: factory, CRUD + quyền + owner, `assert_list_query_count` cho danh sách, bulk, lịch sử.
8. `RATE_LIMITS`/quota mới vào bảng settings và bảng mục 6.

### 11.2 Frontend — chỉ khai báo

1. `src/modules/<m>/module.ts`, `constants/{routes,api-endpoints,query-keys,<m>-permissions}.ts`, `messages/{vi,en}.json`
   (gồm `module`, `nav`, `fields`).
2. `types/` alias từ `openapi.d.ts`; `services/<model>.service.ts` = `createCrudService` + method riêng.
3. `hooks/`: `useListQuery`/`useDetailQuery`/`useResourceMutation`.
4. `components/<x>-table` (`useTableState` + `DataTable`), `components/<x>-form` (một form cho tạo/sửa/xem).
5. `views/`, `navigation.ts`, `app/[locale]/(admin)/admin/<x>/page.tsx` chỉ khai metadata và render View.
6. Ghép vào `routing.ts`, `messages.ts`, `global.d.ts`, `admin-navigation.ts`; test 5.4 bắt nếu quên.
7. Test: unit cho schema/service riêng; e2e một luồng tạo → sửa → xóa.

---

## 12. Thứ tự làm, điểm dừng

| Bước | Việc | Xong khi | Commit |
| --- | --- | --- | --- |
| 0 | Commit toàn bộ hiện trạng lên `develop` (đã chốt); tạo DB `toannx_e2e` cho e2e (B15) | `git status` sạch | `chore(repo)` |
| 1 | **BE core**: view/permission/service/repository (4.1–4.4), đổi 40 view theo bảng 4.1, bỏ 8 view bulk, sửa B1–B2, B4–B5, B14 | 195 test cũ + test 4.8 xanh; OpenAPI chỉ khác `operationId` của bulk | `ref(core)`, `ref(iam)`, mỗi module một `ref(<m>)` |
| 2 | **BE base còn lại**: rate limit + quota khai báo (4.5), mã lỗi theo module (4.6), giới hạn đầu vào (4.9), DB (4.10), dọn dữ liệu (4.11), factory mọi module | test xanh, `ruff`, `mypy`, `spectacular --fail-on-warn` sạch | `ref(core)`, `feat(core)` |
| 3 | **Journal**: tracking trong core (4.7) + module `journal` BE, bật cho model mục 7.2 | test ghi/đọc/rollback/quyền xanh | `feat(core)`, `feat(journal)` |
| 4 | **FE base**: 5.2–5.8, chuyển 6 module FE hiện có sang base, bỏ `ADMIN_ACCESS_REQUIRED`, `RecordHistory` + trang Nhật ký | lint, typecheck, unit, build, e2e xanh | `ref(shares)`, mỗi module một `ref(<m>)`, `feat(journal)` |
| 5 | CI (13 · D5), docs rule/AGENTS/CLAUDE/SYSTEM_CONTEXT theo base mới, `graphify update .` | `check-all` xanh | `chore(repo)`, `docs(repo)` |
| — | **Dừng review 1**: base BE + FE + journal | | |
| 6 | **BE** short_links (mục 9) → qr_codes (mục 8) → custom_pages (mục 10); viết lại `frontend-module-contract.md` | test xanh | `feat(short-links)`, `feat(qr-codes)`, `feat(custom-pages)` |
| — | **Dừng review 2** | | |
| 7 | **FE** short-links → qr-codes → custom-pages | unit + e2e xanh | như trên |
| 8 | `SYSTEM_CONTEXT.md`, `graphify update .`, `check-all` | xanh | `docs(repo)` |

---

## 13. Quyết định

### 13.1 Đã chốt

| Mã | Chốt |
| --- | --- |
| Core | Base BE còn `CoreApiView`, `CoreModelViewSet`, `CoreCrudService`; khác thì ghi đè trong lớp con theo bảng 4.1 |
| Chuẩn hóa | Làm cho **toàn bộ** module BE và FE hiện có, không chỉ module mới |
| QR | Mã QR là module riêng có trang quản lý; trong Tiptap chèn mã QR là chèn **ảnh** |
| Journal | Có module journal; model khai `journal_fields` là được ghi lịch sử |
| Q21 | API chỉ theo quyền IAM; `is_staff` chỉ để vào khung quản trị FE |
| Q22, Q17 | Xem bản nháp theo đúng phân quyền hệ thống; không có quyền → 404 |
| Q1, Q1b, R3 | Ai có `custom_pages.path.create` thì tạo đường dẫn giữa; tạo/sửa nhanh bằng dialog chứa form đầy đủ |
| Q2, Q2b | Trang bắt buộc có đường dẫn giữa; seed `p`, `qr` |
| Q6, Q19, Q20 | Ảnh URL ngoài giữ nguyên link; video chỉ YouTube |
| Q13 | Màn quản lý nằm trong khung quản trị |

### 13.2 Mặc định — sửa dòng nào trước bước 0 nếu muốn đổi

| Mã | Mặc định (plan viết theo) | Phương án khác |
| --- | --- | --- |
| D1 | **Đã chốt**: commit toàn bộ working tree lên `develop` rồi refactor tại chỗ | — |
| D2 | Ai đọc được bản ghi thì đọc được lịch sử của bản ghi đó; nhật ký toàn hệ thống cần `journal.entry.read` | Lịch sử chỉ cho người có `journal.entry.read` |
| D3 | BE sinh ảnh QR bằng `segno`; sửa mã QR thay nội dung trong **cùng** attachment để ảnh đã chèn tự cập nhật | Mỗi lần sửa sinh ảnh mới (trang cũ giữ mã cũ) |
| D4 | Sinh kiểu FE từ OpenAPI và chuyển cả 6 module hiện có | Chỉ dùng cho module mới |
| D5 | CI bằng GitHub Actions có service PostgreSQL, chạy `check-all` + e2e | Chỉ giữ git hook |
| D6 | Dọn dữ liệu hằng ngày bằng Vercel Cron gọi endpoint có `CRON_SECRET` | Chạy lệnh tay |
| D7 | Mã lỗi mỗi module một enum; test BE kiểm bản dịch FE | Giữ một enum chung trong core |
| D8 | FE `auth` là module nền, không import module khác | Giữ như hiện tại |
| D9 | CSP bật `Report-Only` một vòng rồi mới chặn thật | Bật chặn ngay |
| D10 | Journal không lưu nội dung trang (`content`), chỉ ghi "đã đổi nội dung" | Lưu cả bản cũ/mới |
| R5 | Segment 1–32 ký tự; slug trang 3–64 | Segment 3–64, đổi seed `p` thành `trang` |
| R6 | Nâng common `RichTextEditor` (JSON + extensions); node riêng nằm trong `custom-pages` | Editor riêng trong module |
| Q3 | Tắt đường dẫn giữa chỉ chặn tạo trang mới; đổi segment được, URL cũ 404 | Cấm đổi khi còn trang |
| Q4 | Owner bị khóa thì trang công khai vẫn chạy | Tự ẩn |
| Q5 | Slug/segment đã xóa không dùng lại | Cho dùng lại |
| Q7 | Quy tắc chuyển khoản ở 8.2 | — |
| Q8, Q9 | Short link cố định `/s/{slug}`; chặn đích `/s/…` của site | — |
| Q10 | Bấm Lưu mới lưu; `content_version` chặn ghi đè; bản chưa lưu giữ tạm trong trình duyệt | Tự lưu |
| Q11 | Bỏ bảng block, chuyển dữ liệu cũ sang Tiptap | Giữ song song |
| Q12 | Giới hạn ở mục 6 | — |
| Q14 | Chữ của site trên trang công khai theo cookie/trình duyệt, mặc định `vi` | Luôn `vi` |
| Q15 | Thư viện mới: BE `segno`, `napas-qr-python` (VietQR); FE `@tiptap/static-renderer`, `@tiptap/extension-{youtube,text-align,highlight,color,list,drag-handle-react}`, `openapi-typescript`, `eslint-plugin-boundaries` (không cần `qrcode` ở FE nữa) | — |
| Q16 | Mẫu khi tạo trang + nút Nhân bản | Chỉ một trong hai |
| Q18 | Làm base trước, dừng review, rồi mới làm module nội dung | Làm một lượt |
