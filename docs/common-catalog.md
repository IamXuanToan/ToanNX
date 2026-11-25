# Danh mục common của hệ thống (BE + FE)

File này liệt kê **mọi thành phần dùng chung** đã có. Trước khi viết code mới, tra ở đây: đã có thì dùng lại,
không viết bản thứ hai. Cách dùng chi tiết nằm ở docstring/JSDoc của từng file và ở `docs/rules/`.

**Quy tắc cập nhật** (rule chung mục 3.3):

- Thêm, đổi tên, xóa hay đổi công dụng của một common (`backend/app/core/`, service công khai của `system`,
  `frontend/src/shares/`, phần `system`/`manage-app` mà module khác dùng) thì **sửa file này trong cùng lần đó**.
- Mỗi dòng: tên export, đường dẫn file, dùng khi nào. Giữ đúng nhóm, xếp theo thứ tự chữ cái trong nhóm nếu được.
- Common mới chỉ được tạo khi danh mục này chưa có thứ tương đương; có thứ gần giống thì mở rộng cái đã có.

Mục lục: [1. Backend core](#1-backend--appcore) · [2. Backend dùng chung từ system](#2-backend--dùng-chung-từ-module-system)
· [3. Backend test](#3-backend--test-dùng-chung) · [4. Frontend shares](#4-frontend--srcshares)
· [5. Frontend dùng chung từ system/manage-app](#5-frontend--dùng-chung-từ-module-system--manage-app)

---

## 1. Backend — `app/core/`

Gốc: `backend/app/core/`. Core không import module nghiệp vụ (trừ `TYPE_CHECKING`).

### 1.1 Lớp nền (kế thừa, không tạo lớp nền mới)

| Export | File | Dùng khi |
| --- | --- | --- |
| `CoreModel` | `models/core_model.py` | Gốc mọi model nghiệp vụ: id UUID, `created_at`/`updated_at`, audit `created_by`/`updated_by`/`deleted_by`, xóa mềm |
| `CoreQuerySet` | `models/core_query_set.py` | QuerySet mặc định của `CoreModel` (lọc bản đã xóa mềm) |
| `JournalTracker` | `tracking/journal_tracker.py` | Mixin đặt **trước** `CoreModel` để CRUD tự ghi lịch sử (`journal_fields`, `journal_masked_fields`, `journal_event`) |
| `CoreRepository` | `repositories/core_repository.py` | Gốc mọi repository: `get_queryset`, `get_queryset_with_deleted`, `get_by_id`, `find_one`, `exists`, `count`, `get_for_update`, `create`, `update`, `update_where`, `bulk_create`, `delete`, `delete_where`, `hard_delete`, `hard_delete_where` |
| `CoreCrudService` | `services/core_crud_service.py` | Gốc mọi service CRUD: `owner_field`, `manage_all_permission`, `owner_quota_setting`, `public_cache_namespace` (tài nguyên hiện trên trang công khai: create/update/delete tự làm mới cache sau commit; ghi thẳng repository thì gọi `invalidate_public_cache()`), `*_for(actor)`, `get_for_write`, `bulk_update`, `bulk_delete`, `log_event` |
| `CoreModelViewSet` | `views/core_model_view_set.py` | Gốc mọi API CRUD: khai serializer, filter, `action_permissions`, `bulk_update_serializer_class`, `bulk_delete_enabled`, `history_enabled`, `action_rate_limits` |
| `CoreApiView` | `views/core_api_view.py` | Gốc mọi API không phải CRUD; `get_actor(request)`; bảng ghi đè `permission_classes` cho API công khai/chỉ đăng nhập |
| `CoreModuleConfig` | `registry/core_module_config.py` | `AppConfig` của mọi module (`label` = mã module, tự đăng ký) |
| `CoreValidateSerializer` | `serializers/core_validate_serializer.py` | Gốc serializer input (từ chối field lạ) |

### 1.2 Khai báo module và quyền

| Export | File | Dùng khi |
| --- | --- | --- |
| `ModuleDescriptor` | `registry/module_descriptor.py` | `module.py` của mỗi module: quyền, `member_permissions` (bắt buộc khi có quyền: `*XxxPermission.member()` của vai trò `<MÃ>_MEMBER`, không gồm `manage_all`/`read_private`), `dependencies`, `cleanup_tasks`, `notification_events`, `webhooks`, `callbacks` |
| `ModuleRegistry` | `registry/module_registry.py` | Tra danh sách module đã cài (không tự đăng ký tay); `notification_event_definitions()`, `find_notification_event(code)`, `validate_notification_permissions()` (gọi khi khởi động) |
| `WebhookDefinition` | `registry/webhook_definition.py` | Một webhook bên thứ ba gọi vào (`path` sau `/api/v1`, mô tả, `auth`, `setup`) khai trong `webhooks`; hiện ở Hệ thống → Webhook |
| `CallbackDefinition` | `registry/callback_definition.py` | Một URL callback trên FE (OAuth...) khai trong `callbacks` (`path`, `setup`, `setting` báo đã cấu hình); hiện ở Hệ thống → Callback |
| `NotificationEventDefinition` | `registry/notification_event_definition.py` | Một sự kiện thông báo `<module>.<resource>.<event>` khai trong `notification_events`: `scope` (PERSONAL/SYSTEM), `audience` (OWNER/SUBSCRIBERS), `permission`, `default_level` (INFO/WARNING/ERROR), `default_channels`, `kind` business/technical; `validate()` |
| `PermissionCatalog` | `registry/permission_catalog.py` | Gốc danh mục quyền `permissions/<model>_permission.py`; `.all()`; `MEMBER = (...)` + `.member()` khai quyền của vai trò thành viên |
| `PermissionDefinition` | `registry/permission_definition.py` | Một quyền `<module>.<resource>.<action>` có name + description |

### 1.3 Decorator, permission, filter, phân trang

| Export | File | Dùng khi |
| --- | --- | --- |
| `validate_request` | `decorators/validate_request.py` | Method APIView nhận input: validate rồi truyền `validated_data` |
| `rate_limit` | `decorators/rate_limit.py` | Rate limit riêng cho method APIView (khóa trong `settings.RATE_LIMITS`); ViewSet dùng `action_rate_limits` |
| `IsActiveAuthenticated` | `permissions/is_active_authenticated.py` | Permission mặc định; view chỉ cần đăng nhập thì `permission_classes = [IsActiveAuthenticated]` |
| `CsrfProtected` | `permissions/csrf_protected.py` | API công khai đổi trạng thái bằng cookie |
| `enforce_csrf` | `security/csrf.py` | Kiểm CSRF thủ công cho API dùng cookie |
| `CoreSearchFilter` | `filters/core_search_filter.py` | `?search=` không dấu (`unaccent`), ≤ 100 ký tự, ≤ 5 từ |
| `CoreCharInFilter` | `filters/core_char_in_filter.py` | Lọc chuỗi nhiều giá trị `?module=a,b` |
| `CoreChoiceInFilter` | `filters/core_choice_in_filter.py` | Lọc theo `choices` nhiều giá trị `?status=A,B` (ngoài choices → 400) |
| `CoreBooleanInFilter` | `filters/core_boolean_in_filter.py` | Lọc boolean `?is_active=true,false` |
| `CoreUUIDInFilter` | `filters/core_uuid_in_filter.py` | Lọc UUID nhiều giá trị `?role=<uuid>,<uuid>` |
| `CoreInFilterMixin` | `filters/core_in_filter_mixin.py` | Gốc bộ lọc nhiều giá trị (≤ 50 giá trị); chỉ dùng khi tạo bộ lọc `Core*InFilter` mới |
| `CorePageNumberPagination` | `pagination/core_page_number_pagination.py` | Phân trang chỉ khi có `page`/`page_size` (≤ 100); đã cấu hình mặc định |

### 1.4 Response, lỗi, OpenAPI

| Export | File | Dùng khi |
| --- | --- | --- |
| `CoreResponse` | `responses/core_response.py` | Response thành công `{success, data, meta}` từ APIView |
| `CorePaginationResponse` | `responses/core_pagination_response.py` | Response danh sách có phân trang |
| `CoreErrorResponse` | `responses/core_error_response.py` | Response lỗi `{success: false, error}` (thường do exception handler dựng) |
| `build_meta`, `build_error_body` | `responses/response_body.py` | Dựng body chuẩn cho `JsonResponse` ngoài DRF |
| `ErrorCode` | `constants/error_codes.py` | Mã lỗi chung; mã riêng của module ở `constants/<m>_error_code.py` |
| `AppException` | `exceptions/app_exception.py` | Gốc mọi lỗi có mã; lỗi riêng kế thừa lớp con bên dưới |
| `ValidationError` (400), `AuthenticationError` (401), `AuthorizationError` (403), `NotFoundError` (404), `ConflictError` (409), `BusinessRuleError` (422), `RateLimitError` (429) | `exceptions/<tên>.py` | Raise từ service theo đúng loại lỗi |
| `app_exception_handler`, `handler400/403/404/500` | `exceptions/exception_handler.py` | Đã cấu hình trong settings/urls; không tự bắt lỗi trong view |
| `CoreAutoSchema` | `schemas/core_auto_schema.py` | OpenAPI tự bọc envelope (đã cấu hình mặc định) |
| `build_success_schema`, `build_meta_schema` | `schemas/response_envelope.py` | Schema envelope khi cần khai OpenAPI thủ công |

### 1.5 Serializer dùng chung

| Export | File | Dùng khi |
| --- | --- | --- |
| `CoreBulkIdsValidateSerializer` | `serializers/core_bulk_ids_validate_serializer.py` | Body thao tác hàng loạt (1–100 id); kế thừa để thêm field |
| `CoreBulkResultResponseSerializer` | `serializers/core_bulk_result_response_serializer.py` | Response `{count}` của bulk |
| `CoreJournalEntryResponseSerializer` | `serializers/core_journal_entry_response_serializer.py` | Một mục lịch sử thay đổi (action `history`, API journal) |

### 1.6 Ngữ cảnh, log, lịch sử, lưu trữ

| Export | File | Dùng khi |
| --- | --- | --- |
| `get_current_user`, `get_user_id`, `get_request_id`, `get_current_request`, `set_current_user`, `request_context` | `context/user_context.py` | Đọc người dùng/request_id hiện tại ngoài view (repository ghi audit, log) |
| `RequestContextMiddleware` | `middleware/request_context_middleware.py` | Đã cài: dựng ngữ cảnh request |
| `RequestContextFilter` | `logging/request_context_filter.py` | Đã cài: gắn `request_id` vào log |
| `StepTimer` | `logging/step_timer.py` | Đo từng bước một luồng: `mark(step)` rồi `log()` → `<name> steps a=..ms total=..ms` (kèm `request_id`); chỉ tên bước + ms, không dữ liệu người dùng |
| `CacheService` | `cache/cache_service.py` | Redis (Upstash) **chỉ để tăng tốc**: `get_json`/`set_json`/`delete`, `incr_window` (bộ đếm cửa sổ), `namespace_version`/`bump_namespace`; `REDIS_URL` trống hoặc Redis lỗi → như cache miss, không ném lỗi (tạm ngắt 30 giây). Khóa `<module>:<resource>:...`, luôn có TTL; không dùng cho request của quản trị viên, phiên đăng nhập hay dữ liệu gốc |
| `ChangeRecorder` | `tracking/change_recorder.py` | Hợp đồng nơi lưu lịch sử (bản thật ở `system`) |
| `ChangeSet` | `tracking/change_set.py` | Dữ liệu một thay đổi do `JournalTracker` phát |
| `get_change_recorder` | `tracking/recorder_registry.py` | Nạp recorder từ `CORE_CHANGE_RECORDER` |
| `R2Storage` | `storage/r2_storage.py` | Storage backend Cloudflare R2 (cấu hình qua settings) |
| `R2UsageService` | `storage/r2_usage_service.py` | Lấy dung lượng đã dùng trên R2 |
| `SecretCipher` | `security/secret_cipher.py` | Mã hóa/giải mã bí mật bên thứ ba của từng người dùng lưu DB (token SePay, bot Telegram): `encrypt(purpose, plaintext)` / `decrypt(purpose, token)`; khóa Fernet dẫn xuất từ `DJANGO_SECRET_KEY` theo mục đích; lỗi → `SecretCipherError` |

### 1.7 Tiện ích và validator

| Export | File | Dùng khi |
| --- | --- | --- |
| `to_ascii`, `ascii_slug` | `utils/text.py` | Bỏ dấu ở Python (`anyascii`); không tự viết bảng bỏ dấu |
| `normalize_slug`, `generate_slug` | `utils/slug.py` | Slug URL công khai (link rút gọn, trang, đoạn đường dẫn) |
| `validate_public_url`, `build_absolute_url`, `build_backend_url` | `utils/url.py` | Kiểm URL người dùng nhập; dựng URL tuyệt đối theo request; `build_backend_url` = URL theo Host backend thật (webhook bên thứ ba gọi thẳng) |
| `CoreValidator` | `validators/core_validator.py` | Quy tắc validate dùng lại giữa các module |

---

## 2. Backend — dùng chung từ module `system`

`system` là module nền; module khác chỉ dùng **service công khai** và các phần khai dưới đây, không import
repository của `system`.

| Export | File | Dùng khi |
| --- | --- | --- |
| `require_permission` | `system/decorators/require_permission.py` | Gắn quyền cho method APIView (`check=`, `allow_if=`, `require_all=`) |
| `permission_rule`, `DENY` | `system/types/permission_rule.py` | Khai `action_permissions` của ViewSet; `DENY` đóng tường minh một action |
| `HasIamPermission` | `system/permissions/has_iam_permission.py` | Permission IAM mặc định (đã cấu hình trong settings) |
| `IamPermissionBackend` | `system/backends/iam_permission_backend.py` | `User.has_perm` hỏi IAM (đã cấu hình) |
| `BucketThrottle` | `system/throttles/bucket_throttle.py` | Throttle mặc định theo `settings.RATE_LIMITS` (đã cấu hình) |
| `AttachmentService` | `system/services/attachment_service.py` | File/ảnh của module khác: `get_image` (chỉ ảnh công khai), `find_alive_images` (bỏ file riêng tư), `public_url` (None nếu riêng tư), `get_content_for`, `set_visibility`, `create_generated`, `replace_content`, `delete_generated`, `get_current_storage_usage_bytes` |
| `AttachmentStorageService` | `system/services/attachment_storage_service.py` | Nơi duy nhất chọn kho theo `Attachment.visibility` (`STORAGES["default"]` / `STORAGES["private"]`): lưu, mở, xóa, chép giữa kho, link ký hạn ngắn; không dùng `attachment.file.storage` trực tiếp |
| `Attachment` | `system/models/attachment.py` | Khóa ngoại tới tệp đính kèm (ảnh bìa, avatar...) |
| `AttachmentPermission` | `system/permissions/attachment_permission.py` | Quyền đọc/ghi thư viện khi module khác cần kiểm |
| `User` | `system/models/user.py` (`settings.AUTH_USER_MODEL`) | Khóa ngoại người dùng; ưu tiên `settings.AUTH_USER_MODEL` trong model |
| `get_client_ip` | `system/utils/client_ip.py` | Lấy IP client thực tế sau proxy (thuật toán right-to-left lọc Cloudflare và mạng nội bộ chống spoofing) |
| `EmailService` | `system/services/email_service.py` | Gửi email: `send_template(template=, subject=, recipient=, context=, locale=, async_send=)` dựng `system/email/<template>_<lang>.{txt,html}`; `send_now(...)` gửi đồng bộ (outbox, serverless). Tạo `self.email_service = EmailService()` trong `__init__` |
| `NotificationService` | `system/services/notification_service.py` | Cách **duy nhất** để module phát thông báo: `notify(event_code, *, dedup_key, payload, recipient=None, recipients=None)` (OWNER phải có `recipient`; SUBSCRIBERS tự tìm người có `permission`); `revoke(event_code, dedup_key)`; outbox chống trùng, **không gửi trong request** (sau commit chỉ đá `NotificationKickService`), lỗi không ném ra; `dispatch_pending(force=False)` cho QStash/cron |
| `NotificationPayload` | `system/types/notification_payload.py` | Nội dung một thông báo: `title`, `body` ngắn (chuông, popup), `details=(("💻 Thiết bị", "Chrome trên Windows"), ...)` cho Telegram/email, `link`, `level`, `message_key`/`params` (FE dịch) |
| `NotificationMessageFormatter` | `system/services/notification_message_formatter.py` | Khuôn tin Telegram (HTML) và email: icon sự kiện (`NotificationEventDefinition.icon`, mặc định theo mức) + tiêu đề, dòng `details` (bỏ dòng trống), giờ Việt Nam, link "Xem chi tiết" |
| `describe_user_agent` | `system/utils/user_agent.py` | User-Agent → nhãn ngắn "Chrome trên Windows", "Cốc Cốc trên Windows" cho thông báo |
| `NotificationKickService` | `system/services/notification_kick_service.py` | Nội bộ thông báo: `kick(delay)` hạ mốc "có việc" trong Redis + đăng tin QStash; `has_due_work()` để cron không chạm DB khi chưa có việc |
| `QstashClient` | `system/services/qstash_client.py` | Đăng tin Upstash QStash gọi lại backend (`publish`, timeout 1 giây, lỗi không ném) và kiểm `Upstash-Signature` (`verify`) |
| `NotificationPayload` | `system/types/notification_payload.py` | Nội dung thông báo: `title`, `body` (văn bản thuần, kênh tự escape), `link` (đường dẫn FE bắt đầu `/`), `level` (ghi đè mức mặc định), `message_key` + `params` (FE dịch), `data`, `expires_at` |
| `TelegramClient` | `system/services/telegram_client.py` | Gọi Telegram Bot API (getMe/getWebhookInfo/getUpdates/getChatMember/sendMessage), token truyền theo tham số (bot của từng người, lưu DB qua `SecretCipher`), đổi lỗi thành mã ổn định |
| `CurrencyService` | `system/services/currency_service.py` | Danh mục tiền tệ (seed VND gốc, USD): `base()`, `get_active(pk)`; khóa ngoại tới `system.Currency` |
| `ExchangeRateService` | `system/services/exchange_rate_service.py` | Tỷ giá quy về VNĐ: `resolve(currency, date)` (cache DB → Vietcombank, lùi tối đa 7 ngày), `resolve_by_id`, `refetch`; tỷ giá nhập tay ưu tiên hơn API |
| `SettingService` / `SettingKey` | `system/services/setting_service.py`, `system/constants/setting_key.py` | Đọc/ghi `system.Setting` (`get_setting_value`, `set_setting_value(key, value, *, ...)`); khóa dùng trong code khai ở `SettingKey`, không viết chuỗi trực tiếp |
| `get_frontend_origin` | `system/utils/frontend_url.py` | Origin FE để dựng link (email, link công khai) |
| `detect_content_type` | `system/utils/file_signature.py` | Nhận loại file thật theo chữ ký byte khi nhận upload |
| `looks_like_svg`, `find_svg_problem` | `system/utils/svg_inspector.py` | Kiểm SVG an toàn trước khi lưu |
| `PasswordValidator` | `system/validators/password_validator.py` | Luật mật khẩu |

---

## 3. Backend — test dùng chung

| Export | File | Dùng khi |
| --- | --- | --- |
| `BaseApiTestCase` | `core/tests/base/base_api_test_case.py` | Gốc test API (client, envelope) |
| `UserFactory`, `StaffFactory`, `SuperuserFactory`, `RoleFactory` | `system/tests/factories/` | Tạo người dùng/vai trò trong test |
| `grant` | `system/tests/helpers/permission_helper.py` | Cấp quyền cho user trong test: `grant(user, P.READ)` |
| `upload_file` | `system/tests/helpers/attachment_test_helper.py` | Upload file qua API trong test |
| `fake_redis` (fixture), `FakeRedis` | `conftest.py`, `core/tests/helpers/fake_redis.py` | Bật `CacheService` với Redis giả trong bộ nhớ (đếm số lệnh); mặc định test không có Redis |
| `sign` | `system/tests/helpers/qstash_helper.py` | Tạo `Upstash-Signature` hợp lệ cho test endpoint dispatch |
| `test_endpoint_access.py` | `core/tests/` | Thêm tên view công khai/chỉ đăng nhập |
| `test_list_query_count.py` | `core/tests/` | Thêm một dòng cho mỗi endpoint danh sách |
| `test_module_conventions.py` | `core/tests/` | Kiểm quy ước module, view, quyền; thêm kiểm tra tự động cho rule mới ở đây |

---

## 4. Frontend — `src/shares/`

Gốc: `frontend/src/shares/`. `shares/` không import module.

### 4.1 UI primitive — `components/ui/` (shadcn)

`accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `checkbox`,
`command`, `dialog`, `dropdown-menu`, `field`, `hover-card`, `input`, `label`, `popover`, `radio-group`, `select`, `separator`,
`sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `tooltip`, `chart`
(shadcn chart = recharts: `ChartContainer` + `ChartTooltip`/`ChartLegend`, màu theo token `--chart-1..5`).

Thiếu thì thêm bằng `pnpm dlx shadcn@latest add <name>` rồi ghi vào danh sách này. Màn hình nghiệp vụ ưu tiên
component trong `common/` bên dưới; chỉ dùng thẳng `ui/*` khi `common/` chưa có thứ tương đương.

### 4.2 Form — `components/common/`

| Export | File | Dùng khi |
| --- | --- | --- |
| `Form` | `form.tsx` | Thẻ form hệ thống (`noValidate`, có id cho nút submit ngoài form) |
| `useFormId`, `FormIdContext` | `hooks/use-form-id.ts`, `form-id-context.ts` | Đọc id của `Form` gần nhất (nút submit đặt ngoài thẻ form) |
| `FormPage` | `form-page.tsx` | Khung trang tạo/sửa/chi tiết (header dính, không mũi tên quay lại); tự hiện nút Sửa khi trong `EditModeProvider` |
| `EditModeProvider`, `EditModeContext` | `edit-mode-provider.tsx`, `edit-mode-context.ts` | View trang chi tiết bọc nội dung để `FormPage` hiện nút Sửa khi đang chỉ xem mà có quyền |
| `EditModeButton` | `edit-mode-button.tsx` | Nút Sửa trên header (thêm `?mode=edit`); `FormPage` tự render, không dùng riêng |
| `FormLayout` | `form-layout.tsx` | Bố cục 2 cột: cột chính + cột phụ 22rem |
| `FormSection` | `form-section.tsx` | Nhóm trường có tiêu đề (card) |
| `FormField` | `form-field.tsx` | Nối label, mô tả, lỗi RHF với input; `required` → `*` đỏ; `tooltip` → icon dấu chấm than hover xem gợi ý |
| `FormActions` | `form-actions.tsx` | Nút Hủy + nút chính, portal lên header của `FormPage` |
| `FormSubmitButton` | `form-submit-button.tsx` | Nút gửi gắn `form=<id>` |
| `FormDialog` | `form-dialog.tsx` | Tạo/sửa nhanh tài nguyên liên quan bằng đúng form của nó |
| `ConfirmDialog` | `confirm-dialog.tsx` | Xác nhận thao tác không hoàn tác (xóa, xóa lô) |
| `FORM_CONTROL_TRIGGER_CLASS`, `FORM_CONTROL_POPOVER_CLASS`, `FORM_CONTROL_OPTION_CLASS` | `form-control.styles.ts` | Class chuẩn cho control dạng nút mở popover |

### 4.3 Ô nhập và chọn — `components/common/`

| Export | File | Dùng khi |
| --- | --- | --- |
| `SelectField`, `SelectOption` | `select-field.tsx` | **Mọi** ô chọn một giá trị (tự có ô tìm từ 8 lựa chọn) |
| `MultiSelect` | `multi-select.tsx` | Chọn nhiều giá trị trong form |
| `FilterSelect` | `filter-select.tsx` | **Mọi** bộ lọc trên toolbar bảng (chọn nhiều) |
| `ChoiceList`, `ChoiceItem`, `ChoiceControl`, `ChoiceLayout` | `choice-list.tsx`, `choice-list.types.ts` | Danh sách chọn vai trò/quyền/cờ bằng checkbox |
| `ChoiceGroups`, `ChoiceGroup` | `choice-groups.tsx` | Như `ChoiceList` nhưng chia nhóm (quyền theo module) |
| `CheckboxField` | `checkbox-field.tsx` | Một checkbox có nhãn/mô tả |
| `SwitchField` | `switch-field.tsx` | Công tắc bật/tắt thiết lập trong form |
| `RadioGroupField`, `RadioOption` | `radio-group-field.tsx` | 2–5 lựa chọn dạng thẻ cần mô tả |
| `SearchInput` | `search-input.tsx` | Ô tìm (Enter mới áp dụng) |
| `EmailInput` | `email-input.tsx` | Ô email |
| `PasswordInput` | `password-input.tsx` | Ô mật khẩu có nút hiện/ẩn |
| `NumberInput` | `number-input.tsx` | Ô số theo định dạng vi-VN |
| `MoneyInput`, `MoneyCurrency`, `DEFAULT_CURRENCY` | `money-input.tsx` | Ô tiền |
| `CodeInput` | `code-input.tsx` | Mã (vai trò, danh mục): chữ, số, `.`, `_`, `-` |
| `SlugInput` | `slug-input.tsx` | Slug URL, tự chuẩn hóa khi gõ |
| `ColorInput` | `color-input.tsx` | Chọn màu HEX (ô màu mở bảng chọn + ô nhập `#RRGGBB`); `inputClassName` chỉnh ô mã khi đặt trên nền tối |
| `TagsInput` | `tags-input.tsx` | Nhập nhiều thẻ (Enter hoặc `,`) |
| `DatePicker` | `date-picker.tsx` | Chọn ngày |
| `TimePicker` | `time-picker.tsx` | Chọn giờ (`minuteStep`) |
| `TimePickerPopover`, `TimeScrollColumn` | `time-picker-popover.tsx`, `time-scroll-column.tsx` | Phần trong của `TimePicker`/`DateTimePicker` (không dùng riêng) |
| `DateTimePicker` | `date-time-picker.tsx` | Chọn ngày + giờ |
| `MonthSelect`, `normalizeMonthValue` | `month-select.tsx` | Chọn tháng 1–12 |
| `ImageUpload`, `UploadedFile` | `image-upload.tsx`, `image-upload.types.ts` | Ảnh đại diện/logo chọn từ Thư viện (module truyền callback; `hideHint` ẩn dòng gợi ý lộ thiên) |
| `TiptapEditor` | `tiptap-editor.tsx` | Editor soạn thảo **duy nhất** (giá trị JSON) |
| `TiptapContent` | `tiptap-content.tsx` | Hiển thị JSON Tiptap chỉ đọc (chạy được ở server) |
| `TiptapToolbar` | `tiptap-toolbar.tsx` | Thanh công cụ của `TiptapEditor` (không dùng riêng) |
| `TiptapToggle`, `UrlPopover` | `tiptap-toggle.tsx`, `url-popover.tsx` | Nút bật/tắt định dạng và ô nhập link bên trong `TiptapToolbar` (không dùng riêng) |
| `createBaseExtensions`, `LibraryImage`, `LINK_PROTOCOLS` | `tiptap-extensions.ts` | Extension chung của editor và nội dung |
| `TiptapDocument`, `TiptapImage`, `TiptapInsertItem`, `TiptapEditorProps` | `tiptap-editor.types.ts` | Kiểu của editor |

### 4.4 Bảng và danh sách — `components/common/`

| Export | File | Dùng khi |
| --- | --- | --- |
| `DataTable` | `data-table.tsx` | **Mọi** bảng: chọn dòng, ẩn/hiện, ghim, resize cột, card mobile dưới `md`, `onView`/`onEdit`/`onDelete` + `can` (luôn hiện, thiếu quyền thì mờ), `rowActions`, `bulkActions`, `pagination` |
| `DataTableColumn`, `DataTableRowAction`, `DataTableBulkAction`, `DataTableProps`... | `data-table.types.ts` | Khai cột và thao tác của bảng |
| `DataPagination`, `PAGE_SIZE_OPTIONS` | `data-pagination.tsx` | Phân trang (truyền qua prop `pagination` của `DataTable`) |
| `TableToolbar` | `table-toolbar.tsx` | Ô tìm + bộ lọc + Tải lại + menu cột |
| `TableBulkBar` | `table-bulk-bar.tsx` | Thanh thao tác hàng loạt đơn dòng chuẩn Linear/Vercel khi chọn dòng (trái: badge số lượng + vạch chia + Bỏ chọn, phải: Đổi trạng thái, thao tác riêng, Xóa) |
| `TableRowActions` | `table-row-actions.tsx` | Cột Xem → Sửa → Sao chép → Xóa (nút mờ + tooltip lý do khi thiếu quyền/dòng khóa) + thao tác riêng |
| `TableStatusSwitch` | `table-status-switch.tsx` | Bật/tắt trạng thái trong bảng (**chỉ** dùng cái này) |
| `TableHeaderCell`, `TableColumnResizer` | `table-header-cell.tsx`, `table-column-resizer.tsx` | Phần trong của `DataTable` (không dùng riêng) |
| `StatusBadge`, `StatusTone` | `status-badge.tsx` | Badge trạng thái theo sắc thái token |
| `UserAvatar`, `getUserDisplayName`, `getUserInitials` | `user-avatar.tsx` | Ảnh đại diện, tên hiển thị, chữ cái đại diện |
| `SortableList`, `reorderArray` | `sortable-list.tsx`, `sortable-item.tsx` | Danh sách kéo thả sắp xếp thứ tự (Reorderable List) chuẩn `@dnd-kit` với `rectSortingStrategy`, hiệu ứng di chuyển mượt mà, hỗ trợ Pointer/Touch (khoảng cách kích hoạt 5px) và phím trợ năng |
| `ActivityTimeline` | `activity-timeline.tsx` | Dòng thời gian lịch sử (dùng qua `RecordHistoryView`) |

### 4.5 Trạng thái, lỗi, khung trang

| Export | File | Dùng khi |
| --- | --- | --- |
| `LoadingState` | `components/common/loading-state.tsx` | Khung chờ cho khối chưa có skeleton riêng |
| `EmptyState` | `components/common/empty-state.tsx` | Không có dữ liệu / lọc ra 0 kết quả |
| `PageHeader` | `components/common/page-header.tsx` | Tiêu đề trang quản trị + hành động |
| `ErrorState` | `components/errors/error-state.tsx` | Khối báo lỗi trong trang |
| `QueryErrorState` | `components/errors/query-error-state.tsx` | Lỗi tải bản ghi (404 → "không tìm thấy" + link quay lại) |
| `ForbiddenView` | `components/errors/forbidden-view.tsx` | Màn 403 |
| `Logo` | `components/layout/logo.tsx` | Logo ngang (biểu tượng + chữ) |
| `LogoMark` | `components/layout/logo-mark.tsx` | Biểu tượng logo vuông (header, màn xác thực, trang lỗi) |
| `LanguageSwitcher` | `components/layout/language-switcher.tsx` | Đổi ngôn ngữ giữ trang hiện tại |
| `ThemeSwitcher` | `components/layout/theme-switcher.tsx` | Đổi Sáng/Tối/Hệ thống |
| `AppProviders` | `components/providers/app-providers.tsx` | Provider gốc: theme, React Query, tooltip, toast |
| `AppAnalytics` | `components/analytics/app-analytics.tsx` | Nhúng Umami Analytics và Vercel Analytics vào layout gốc |

### 4.6 Hook dùng chung — `hooks/`

| Export | File | Dùng khi |
| --- | --- | --- |
| `useListQuery` | `use-list-query.ts` | Truy vấn danh sách (giữ dữ liệu trang trước) |
| `useResourceMutation` | `use-resource-mutation.ts` | **Mọi** mutation: toast chuẩn + invalidate khóa đã khai |
| `useTableState` | `use-table-state.ts` | State bảng trên URL: `search`, `page`, `pageSize`, `ordering`, bộ lọc |
| `useBulkActions` | `use-bulk-actions.ts` | Hook bảng: `bulkDelete(rows)` / `bulkUpdate(rows, patch)` chuẩn (toast + invalidate); thay mọi `useBulkDeleteXxx` riêng |
| `useTabState` | `use-tab-state.ts` | Quản lý active tab đồng bộ 2 chiều với URL query param (`?tab=...`), lưu URL không reload |
| `useEditMode` | `use-edit-mode.ts` | View trang chi tiết: `useEditMode(canUpdate)` = có quyền **và** URL `?mode=edit`; truyền kết quả xuống form |
| `useApiErrorMessage` | `use-api-error-message.ts` | Dịch lỗi API theo mã |
| `useMessage` | `use-message.ts` | Dịch khóa đầy đủ do module khai (`system.account.nav.users`) |
| `useStoredPreference` | `use-stored-preference.ts` | Lưu tùy chọn người dùng vào localStorage (key không tiền tố `toannx`) |
| `useMediaQuery` | `use-media-query.ts` | Theo dõi media query |
| `useIsMobile` | `use-mobile.ts` | Đang ở kích thước mobile |
| `useFormExtension`, `useFormExtensionRegistry` | `components/common/hooks/use-form-extension.ts` | Module khác cắm phần mở rộng vào form qua slot `extensions` |
| `useTiptapInsertItem`, `useTiptapPluginRegistry` | `components/common/hooks/use-tiptap-plugins.ts` | Module thêm mục chèn vào editor qua slot `editorPlugins` |

Hook trong `components/common/hooks/` còn lại là hook riêng của từng component chung (`useDataTable`,
`useSelectField`, `useFilterSelect`...): không gọi trực tiếp từ module.

### 4.7 API và dữ liệu — `lib/api/`

| Export | File | Dùng khi |
| --- | --- | --- |
| `apiClient`, `refreshSession` | `api-client.ts` | Gọi API trong service (camel ⇄ snake, CSRF in-memory/cookie, refresh single-flight, cross-origin với credentials include); request bị người gọi hủy (`signal`) → `ApiError` mã `REQUEST_CANCELLED`, không ném lại `AbortError` |
| `createCrudService` | `create-crud-service.ts` | Service CRUD chuẩn cho một ViewSet BE |
| `createResourceKeys`, `ResourceKeys` | `resource-keys.ts` | Query key chuẩn `[module, resource, ...]` |
| `toPaginated` | `to-paginated.ts` | Chuẩn hóa response danh sách thành `Paginated` |
| `ApiError`, `isApiError`, `CLIENT_ERROR_CODES` | `api-error.ts` | Lỗi API có mã |
| `serverApiGet`, `backendFetch` | `server-api.ts` | Gọi Django từ server component / route handler |
| `readCsrfToken`, `ensureCsrfToken`, `CSRF_COOKIE_NAME`, `CSRF_HEADER_NAME` | `csrf.ts` | CSRF (đọc cookie hoặc in-memory khi cross-subdomain; thường `apiClient` đã lo) |
| `keysToCamel`, `keysToSnake`, `toCamelKey`, `toSnakeKey` | `case-conversion.ts` | Đổi khóa khi tự xử lý dữ liệu ngoài `apiClient` |
| `SESSION_API_PATHS`, `PATHS_WITHOUT_REFRESH` | `session-paths.ts` | Path phiên chỉ `apiClient` dùng; không thêm path module vào đây |

### 4.8 Tiện ích — `lib/`, `config/`

| Export | File | Dùng khi |
| --- | --- | --- |
| `createPageMetadata`, `buildAlternates` | `lib/seo.ts` | Metadata trong `page.tsx`/`layout.tsx` |
| `createQueryClient` | `lib/query-client.ts` | QueryClient (không retry 4xx) |
| `emailField`, `passwordField`, `slugField`, `moneyField` | `lib/field-schemas.ts` | Field zod dùng lại trong `schemas/` |
| `formatDisplayNumber`, `formatDisplayMoney`, `getNumberSeparators`, `APP_NUMBER_LOCALE` | `lib/number-format.ts` | Hiển thị số/tiền |
| `parseIsoDate`, `formatIsoDate`, `toInputDate`, `toInputDateTime`, `mergeDateAndTime`, `parseTimeString`, `formatTimeString`, `parseDateTimeLocal`, `formatDateTimeLocal`, `snapMinuteToStep`, `HOUR_OPTIONS`, `MINUTE_OPTIONS` | `lib/date-time-input.ts` | Chuyển đổi giá trị ngày/giờ |
| `getDateFnsLocale`, `getDateDisplayFormat` | `lib/date-fns-locale.ts` | Locale và định dạng ngày theo ngôn ngữ |
| `normalizeSearchText`, `filterOptionsByKeyword` | `lib/search-text.ts` | Tìm không dấu, không phân biệt hoa thường ở FE |
| `sanitizeCodeInput`, `sanitizeSlugInput`, `isValidCodeValue`, `isValidSlugValue`, `CODE_VALUE_REGEX`, `SLUG_VALUE_REGEX` | `lib/code-slug-input.ts` | Lọc/kiểm mã và slug |
| `isOnline`, `ONLINE_WINDOW_MS` | `lib/presence.ts` | Người dùng đang trực tuyến |
| `createBooleanBulkStatus` | `lib/bulk-status.ts` | `bulkStatus` của `DataTable` cho cờ boolean (đang dùng/tắt, xuất bản/ẩn) |
| `EDIT_MODE_PARAM`, `EDIT_MODE_VALUE`, `withEditMode` | `lib/edit-mode.ts` | Hook bảng: `edit` → `withEditMode(<M>_ROUTES.xxxDetail(id))` mở thẳng chế độ sửa |
| `ICON_PATHS`, `normalizeMediaUrl`, `isUnoptimizedImage` | `lib/asset-paths.ts` | Đường dẫn tài nguyên tĩnh SVG trong `public/` và chuẩn hóa URL media backend cho Next rewrite / CSP |
| `env` | `config/env.ts` | **Chỗ duy nhất** đọc `process.env` (gồm `apiBaseUrl`, `siteUrl`, `NEXT_PUBLIC_FIREBASE_*`) |
| `isPushSupported`, `getPushToken`, `deletePushToken`, `NOTIFICATION_SW_PATH` | `lib/firebase-messaging.ts` | Lấy/xóa token FCM (đăng ký `public/notification-sw.js`); chỉ dùng qua hook push của `system` |

### 4.9 Kiểu dùng chung — `types/`

| Export | File | Dùng khi |
| --- | --- | --- |
| `ApiModel`, `ApiSchemas`, `Camelize` | `types/api-schema.ts` | Kiểu từ OpenAPI: `ApiModel<"ShortLinkListResponse">` |
| (sinh tự động) | `types/api-schema.gen.ts` | Do `pnpm api:types` sinh; không sửa tay |
| `ApiResult`, `ApiMeta`, `Pagination`, `Paginated`, `ListParams`, `HistoryEntry` | `types/api.types.ts` | Envelope, phân trang, tham số danh sách |
| `AttachmentSummary` | `types/attachment.types.ts` | Tóm tắt tệp đính kèm hiển thị ở module khác |
| `AdminModuleNavigation`, `AdminNavItem` (`section`), `AdminNavSection`, `AdminGroupCode`, `MessageKey`... | `types/navigation.types.ts` | Khai `navigation.ts` của module |

---

### 4.10 Tài nguyên tĩnh — `frontend/public/`

Gọi theo đường dẫn qua hằng (SVG dùng chung khai ở `shares/lib/asset-paths.ts`), không vẽ SVG nội tuyến
([frontend.md §3.2](rules/frontend.md)).

| File | Hằng | Dùng khi |
| --- | --- | --- |
| `public/brand/logo.png` | — | Nguồn logo gốc; chỉ script `build_brand_assets.py` đọc |
| `public/brand/logo-mark.png` | — | Chỉ hiển thị qua `Logo`/`LogoMark`, không gọi trực tiếp |
| `public/icons/google.svg` | `ICON_PATHS.google` | Icon thương hiệu Google |
| `public/icons/github.svg` | `ICON_PATHS.github` | Icon thương hiệu GitHub |

## 5. Frontend — dùng chung từ module `system` / `manage-app`

Module khác được import các phần dưới đây (page ghép qua slot); phần còn lại của `system` là nội bộ.

| Export | File | Dùng khi |
| --- | --- | --- |
| `usePermission` | `modules/system/hooks/use-permission.ts` | Kiểm quyền trong View để ẩn/hiện (BE vẫn kiểm lại) |
| `PermissionGate` | `modules/system/components/permission/permission-gate.tsx` | Bọc phần UI cần quyền |
| `useCurrentUser` | `modules/system/hooks/use-current-user.ts` | Người dùng đang đăng nhập |
| `RecordHistoryView` | `modules/system/views/journal-entry/record-history-view.tsx` | Slot `history` của form: `path=".../{id}/history"`, `fieldPrefix` |
| `AttachmentImageUploadView` | `modules/system/views/attachment/attachment-image-upload-view.tsx` | Chọn/tải ảnh từ Thư viện cho `ImageUpload` (hỗ trợ `hideHint`) |
| `AttachmentTiptapImagePlugin` | `modules/system/views/attachment/attachment-tiptap-image-plugin.tsx` | Slot `editorPlugins`: chèn ảnh Thư viện vào editor |
| `AttachmentDetailDialog` | `modules/system/components/attachment/attachment-detail-dialog.tsx` | Dialog chi tiết & inline edit metadata tệp (tối ưu nằm trọn 1 màn hình không scroll, tích hợp công cụ crop/watermark ảnh, video player ghi nhớ âm lượng localStorage, thao tác nhanh, chuyển công khai/riêng tư có xác nhận); `isSelectable` + `selectLabel` cho nơi chọn file không phải ảnh |
| `AttachmentPicker` | `modules/system/components/attachment/attachment-picker.tsx` | Bộ chọn + upload file Thư viện. Mặc định: một ảnh công khai. Props nơi dùng: `accept` (`MediaKind[]`), `visibility` + `lockVisibility` (màn Chứng từ: `"private"` + khóa), `visibilityFilter` (mặc định chế độ đang khóa, không khóa thì `"public"`; `"all"` liệt kê cả hai), `multiple` + `onSelectMany` |
| `AttachmentUpload` | `modules/system/components/attachment/attachment-upload.tsx` | Khu kéo thả upload: `accept` (`imageOnly` là bí danh `["IMAGE"]`), `visibility`, `lockVisibility`, `multiple`; có công tắc Riêng tư khi không khóa |
| `SYSTEM_ROUTES.fileAccess(id)` | `modules/system/constants/routes.ts` | Link chia sẻ file riêng tư `/vi/tep/{id}` (en `/files/{id}`): có quyền thì mở file, không thì màn không có quyền |
| `UserRolePickerView`, `UserRoleFilterView` | `modules/system/views/` | Chọn/lọc vai trò người dùng ở form/bảng khác |
| `NotificationBell` | `modules/system/components/notification/notification-bell.tsx` | Chuông thông báo 2 tab Cá nhân / Hệ thống (đã gắn trong `AdminShell`); realtime FCM + polling 60 giây |
| `useCurrencyOptions`, `useExchangeRateResolve` | `modules/system/hooks/` | Chọn tiền tệ và tra tỷ giá VNĐ ở form module khác (Thu nhập) |
| `SYSTEM_ROUTES`, `SYSTEM_PATHNAMES`, `SYSTEM_API_ENDPOINTS` | `modules/system/constants/` | Link/endpoint của `system` khi module khác cần |
| `journal-field-prefixes.ts` | `modules/system/constants/` | Thêm tiền tố nhãn field cho model có `JournalTracker` |
| `AdminShell` | `modules/manage-app/components/shell/admin-shell.tsx` | Khung quản trị (layout `/quan-tri`) |
| `ADMIN_MODULE_NAVIGATION`, `ADMIN_GROUPS`, `findModuleCodeByPath`, `findActiveNavHref`, `groupNavSections` | `modules/manage-app/constants/admin-navigation.ts` | Đăng ký `navigation.ts` của module mới; nhóm hiển thị; tìm module theo path; gom mục theo cụm cho sidebar |
