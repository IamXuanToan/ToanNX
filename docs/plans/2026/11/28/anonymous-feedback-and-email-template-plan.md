# Kế hoạch Module Góp ý / Báo lỗi Ẩn danh & Quản lý Template Email (Tiptap + Trường trộn)

Trạng thái: **Đã chốt quyết định — ĐẠT (Sẵn sàng triển khai)** | Ngày lập: `2026-11-28`  
Cơ sở đối chiếu: `SYSTEM_CONTEXT.md`, `docs/rules/common.md`, `docs/rules/backend.md`, `docs/rules/frontend.md`, `docs/common-catalog.md`, `docs/architecture/infrastructure.md`, `docs/features/permission-scope.md`, `docs/features/permission-ui.md`, `backend/app/system/services/email_service.py`, `backend/app/utilities/module.py`, `frontend/src/modules/utilities/components/page/public-page.tsx`, `frontend/src/modules/utilities/components/short-link/short-link-landing-card.tsx`.

## Mục lục
1. [Mục tiêu, phạm vi & ngoài phạm vi](#1-mục-tiêu-phạm-vì--ngoài-phạm-vi)
2. [Quyết định cần chốt & dependency](#2-quyết-định-cần-chốt--dependency)
3. [Hiện trạng codebase & thành phần tái sử dụng](#3-hiện-trạng-codebase--thành-phần-tái-sử-dụng)
4. [Ngân sách hạ tầng Free-tier](#4-ngân-sách-hạ-tầng-free-tier)
5. [Kiến trúc Backend & mô hình dữ liệu](#5-kiến-trúc-backend--mô-hình-dữ-liệu)
6. [Phân quyền, bảo mật, bí mật & tệp đính kèm](#6-phân-quyền-bảo-mật-bí-mật--tệp-đính-kèm)
7. [Hợp đồng API & thông báo](#7-hợp-đồng-api--thông-báo)
8. [Kiến trúc Frontend, UI/UX & i18n](#8-kiến-trúc-frontend-uiux--i18n)
9. [Xử lý biên, lỗi & fallback](#9-xử-lý-biên-lỗi--fallback)
10. [Kế hoạch kiểm thử](#10-kế-hoạch-kiểm-thử)
11. [Lộ trình từng giai đoạn & cập nhật tài liệu](#11-lộ-trình-từng-giai-đoạn--cập-nhật-tài-liệu)

---

## 1. Mục tiêu, phạm vi & ngoài phạm vi

- **Mục tiêu nghiệp vụ**:
  1. Cho phép khách vãng lai (ẩn danh, không cần đăng nhập) gửi **góp ý / báo lỗi** (sai link, link hỏng, sai thông tin, góp ý cải thiện…) trực tiếp tại các trang công khai **Custom Page** (`/p/...`, `/qr/...`, `/...`) và **ShortLink** (`/s/...`) thông qua nút tròn nổi giống Chatbot AI.
  2. Gửi **thông báo thời gian thực** đến hồ sơ chủ sở hữu trang/link qua hệ thống thông báo sẵn có (`NotificationService.notify`: Chuông In-App, Web Push, Telegram).
  3. Cung cấp màn quản lý & xử lý góp ý ở cả **Client Portal** (`/ca-nhan/gop-y`, chỉ thấy góp ý thuộc tài nguyên của mình) và **Admin** (`/quan-tri/tien-ich/gop-y`, xem tất cả + lọc theo trạng thái, loại lỗi, đối tượng, người sở hữu `owner`).
  4. Xây dựng module/tài nguyên **Template Email (`EmailTemplate`)** lưu DB bằng **Tiptap**, có **trường trộn (`{{...}}`)**, **trạng thái (`ACTIVE` / `DRAFT` / `ARCHIVED`)**, **phạm vi (`SYSTEM` toàn hệ thống do Admin quản lý vs `PERSONAL` của từng user ở Client)**, và **seed sẵn** các template hệ thống hiện có + template **Cảm ơn góp ý**.
  5. Khi góp ý được xử lý xong (`RESOLVED`), chủ trang hoặc Admin bấm nút **Cảm ơn** để chọn/xem trước template cảm ơn (tự động trộn dữ liệu góp ý) và gửi email cảm ơn tới người đã góp ý.

- **Trong phạm vi**:
  - Nút nổi `PublicFeedbackWidget` chỉ hiển thị ở `PublicPage` và `ShortLinkLandingCard`.
  - Model `PageFeedback` (`utilities`) và `EmailTemplate` (`system`), API CRUD/Filter/Bulk/Action đầy đủ, bảo vệ spam/rate-limit, render trường trộn an toàn (escape HTML chống XSS).
  - Giao diện Admin + Client Portal đầy đủ 3 tầng phân quyền, `DataTable` chuẩn, `FormPage` + `TiptapEditor` có menu chèn trường trộn.

- **Ngoài phạm vi (Non-goals)**:
  - Không hiển thị nút góp ý ẩn danh trong khu vực Admin (`/quan-tri/*`) hoặc Portal (`/ca-nhan/*`).
  - Không xây hệ thống ticket chat hai chiều thời gian thực với khách ẩn danh (chỉ nhận góp ý một chiều + gửi email cảm ơn khi xử lý xong).
  - Không thay thế quy trình gửi email xác thực/đặt lại mật khẩu nếu template DB chưa kích hoạt (luôn fallback về file HTML/TXT trong `system/templates/system/email/` khi không có template DB `ACTIVE`).

---

## 2. Quyết định cần chốt & dependency

### 2.1 Quyết định kiến trúc
| Mã | Chủ đề | Các phương án | Đề xuất & lý do | Trạng thái |
| --- | --- | --- | --- | --- |
| **D1** | Vị trí app Django của 2 chức năng | **A**: Tạo 2 app mới (`feedback`, `email_template`) / **B**: Đặt `PageFeedback` vào `utilities` (cùng `Page` & `ShortLink`) và `EmailTemplate` vào `system` (cùng `EmailService` & `NotificationService`) | **Đã chốt B**: Tái sử dụng trọn vẹn `utilities` và `system`, tránh phình `INSTALLED_APPS`, giảm thời gian cold start serverless Vercel Hobby và đồng nhất quyền với `Page`/`ShortLink`/`Email`. | Đã chốt |
| **D2** | Lưu nội dung `EmailTemplate` | **A**: Chỉ lưu HTML thô / **B**: Lưu `content` (Tiptap JSON `JSONField`) + `html_body` (HTML đã làm sạch sinh từ editor để gửi email nhanh trên BE) + `text_body` (plain text fallback) | **Đã chốt B**: Giữ chuẩn **Tiptap JSON** đồng bộ với `TiptapEditor` / `TiptapContent` của hệ thống, đồng thời BE không cần Node/Tiptap runtime để convert JSON → HTML khi gửi email hàng loạt. | Đã chốt |
| **D3** | Cách chống spam cho form góp ý công khai (`AllowAny`) | **A**: Bắt buộc CAPTCHA ngoài (Turnstile/reCAPTCHA) / **B**: Rate limit theo IP + URL mục tiêu qua Redis (`utilities.feedback.submit`), honeypot field ẩn + giới hạn độ dài & chuẩn hóa input | **Đã chốt B** ở giai đoạn đầu (không tăng dependency ngoài, không làm phiền khách vãng lai), có thể bật thêm Turnstile về sau nếu cần. | Đã chốt |
| **D4** | Quyền xóa/sửa template hệ thống (`scope=SYSTEM`) từ Client Portal | **A**: Client xem được template `SYSTEM` đang `ACTIVE` nhưng chỉ sửa/xóa được template `PERSONAL` do mình tạo / **B**: Client nhân bản (duplicate) template `SYSTEM` thành `PERSONAL` để tùy chỉnh | **Đã chốt A + B**: Client dùng trực tiếp template `SYSTEM` làm mặc định, hoặc bấm "Nhân bản thành mẫu cá nhân" để sửa theo ý mình mà không ảnh hưởng toàn hệ thống. | Đã chốt |

### 2.2 Dependency mới
- **Không cần thêm dependency mới** ở cả Backend (`pyproject.toml`) và Frontend (`package.json`). Dùng lại 100% Tiptap, `html.escape` của Python, `EmailService`, `NotificationService`, `DataTable`, `FormPage`.

---

## 3. Hiện trạng codebase & thành phần tái sử dụng

- **Backend đã có (`backend/app/`)**:
  - `EmailService` (`system/services/email_service.py`): đã hỗ trợ `send_now(subject, recipient, text_body, html_body)` và `send_template(...)` với các template file `email_verification`, `password_reset`, `invitation` (`_vi`/`_en`).
  - `NotificationService.notify(...)` (`system/services/notification_service.py`): đẩy thông báo bất đồng bộ qua outbox + QStash tới chuông In-App, Web Push, Telegram.
  - `Page` & `ShortLink` (`utilities/models/`): đều kế thừa `CoreModel` có `owner` (`ForeignKey(User)`).
  - Common BE (`app/core/`): `CoreModel`, `JournalTracker`, `CoreRepository`, `CoreCrudService`, `CoreModelViewSet`, `CoreApiView`, `Core*InFilter`, `rate_limit`, `validate_request`.
- **Frontend đã có (`frontend/src/`)**:
  - `TiptapEditor` (`shares/components/common/tiptap-editor.tsx`): hỗ trợ `editorPlugins` slot để cắm menu chèn **Trường trộn (`{{variable}}`)**.
  - `DataTable`, `useTableState`, `useBulkActions`, `createBooleanBulkStatus`, `FormPage`, `FormLayout`, `FormSection`, `FormActions`, `useEditMode`, `EditModeProvider`, `useTabState`, `SelectField`, `FilterSelect`, `ConfirmDialog`, `QueryErrorState`, `ForbiddenView`.
  - `PublicPage` (`modules/utilities/components/page/public-page.tsx`) & `ShortLinkLandingCard` (`modules/utilities/components/short-link/short-link-landing-card.tsx`).
- **Common mở rộng**:
  - Cập nhật `docs/common-catalog.md` nếu bổ sung plugin/tiện ích dùng chung chèn trường trộn cho `TiptapEditor` (ví dụ `TiptapMergeFieldPlugin` trong `shares` hoặc `system`).

---

## 4. Ngân sách hạ tầng Free-tier (`docs/architecture/infrastructure.md`)

| Dịch vụ | Tác động ước lượng | Cơ chế kiểm soát / fallback |
| --- | --- | --- |
| **Neon Free** (1 GB, 100 CU-h/tháng) | Lưu bảng `utilities_page_feedback` và `system_email_template` (nhẹ, ~vài KB/bản ghi). | Partial index `condition=Q(deleted_at__isnull=True)` trên `target_owner_id`, `owner_id`, `status`, `code`; danh sách template `SYSTEM` cache Redis 10 phút. |
| **Vercel Hobby** (4h Active CPU/tháng) | API gửi góp ý công khai & API bấm nút Cảm ơn. | Thông báo chuông/push/Telegram đi qua `NotificationService.notify` (outbox + QStash, không gửi ngoài trong request); gửi email cảm ơn đặt timeout SMTP ≤ 5s. |
| **Upstash Redis** (500k lệnh/tháng) | Rate limit theo IP cho endpoint gửi góp ý công khai; cache danh sách template `SYSTEM`. | Redis lỗi tự fallback về PostgreSQL (`CacheService` chuẩn của hệ thống), không bao giờ trả 500. |
| **Cloudflare R2** (10 GB) | Không phát sinh upload file từ khách ẩn danh (tránh lạm dụng dung lượng R2 từ nguồn chưa xác thực). | *Không áp dụng upload từ khách*. |

---

## 5. Kiến trúc Backend & mô hình dữ liệu

### 5.1 Model `PageFeedback` (`backend/app/utilities/models/page_feedback.py`)
Kế thừa `(JournalTracker, CoreModel)`, `db_table = "utilities_page_feedback"`:
- **Enum lồng**:
  - `TargetType(TextChoices)`: `PAGE = "PAGE"`, `SHORT_LINK = "SHORT_LINK"`
  - `FeedbackType(TextChoices)`: `BROKEN_LINK = "BROKEN_LINK"` (Sai link / Link hỏng), `WRONG_INFO = "WRONG_INFO"` (Sai thông tin), `BUG = "BUG"` (Lỗi hiển thị), `SUGGESTION = "SUGGESTION"` (Góp ý), `OTHER = "OTHER"` (Khác)
  - `Status(TextChoices)`: `OPEN = "OPEN"` (Mới gửi), `IN_PROGRESS = "IN_PROGRESS"` (Đang kiểm tra), `RESOLVED = "RESOLVED"` (Đã xử lý), `IGNORED = "IGNORED"` (Bỏ qua)
- **Các trường chính**:
  - `target_type`: `CharField(max_length=20, choices=TargetType.choices)`
  - `page`: `ForeignKey("utilities.Page", null=True, blank=True, on_delete=SET_NULL)`
  - `short_link`: `ForeignKey("utilities.ShortLink", null=True, blank=True, on_delete=SET_NULL)`
  - `target_owner`: `ForeignKey("system.User", on_delete=CASCADE, related_name="received_page_feedbacks")` — chủ sở hữu của Page/ShortLink tại thời điểm gửi (dùng làm `owner_field` cho `CoreCrudService`!).
  - `target_url`: `URLField(max_length=2048)` — URL công khai nơi khách bấm gửi.
  - `target_title`: `CharField(max_length=200, blank=True)` — tên trang / link / sản phẩm (nếu chọn mục cụ thể trên Affiliate).
  - `target_item_id`: `CharField(max_length=64, blank=True)` — ID sản phẩm trên trang Affiliate (nếu có).
  - `feedback_type`: `CharField(max_length=30, choices=FeedbackType.choices, default=FeedbackType.BROKEN_LINK)`
  - `message`: `TextField(max_length=2000)`
  - `sender_name`: `CharField(max_length=100, blank=True, default="")` (nếu trống hiển thị "Ẩn danh")
  - `sender_email`: `EmailField(blank=True, default="")` (khách nhập để nhận email cảm ơn)
  - `status`: `CharField(max_length=20, choices=Status.choices, default=Status.OPEN)`
  - `resolution_note`: `TextField(max_length=1000, blank=True, default="")`
  - `resolved_at`: `DateTimeField(null=True, blank=True)`
  - `resolved_by`: `ForeignKey("system.User", null=True, blank=True, on_delete=SET_NULL, related_name="+")`
  - `thanked_at`: `DateTimeField(null=True, blank=True)`
  - `thanked_by`: `ForeignKey("system.User", null=True, blank=True, on_delete=SET_NULL, related_name="+")`
  - `thank_template`: `ForeignKey("system.EmailTemplate", null=True, blank=True, on_delete=SET_NULL)`
  - `ip_hash`: `CharField(max_length=64, blank=True, default="")` (băm `salted_hmac` từ `DJANGO_SECRET_KEY`, không lưu IP thô).
- **Index**: Partial index `(target_owner, status)` và `(target_type, created_at)` với `condition=Q(deleted_at__isnull=True)`.

### 5.2 Model `EmailTemplate` (`backend/app/system/models/email_template.py`)
Kế thừa `(JournalTracker, CoreModel)`, `db_table = "system_email_template"`:
- **Enum lồng**:
  - `Scope(TextChoices)`: `SYSTEM = "SYSTEM"` (Toàn hệ thống), `PERSONAL = "PERSONAL"` (Cá nhân)
  - `Status(TextChoices)`: `ACTIVE = "ACTIVE"` (Đang dùng), `DRAFT = "DRAFT"` (Nháp), `ARCHIVED = "ARCHIVED"` (Lưu trữ)
  - `Category(TextChoices)`: `AUTH = "AUTH"` (Xác thực hệ thống), `FEEDBACK_THANKS = "FEEDBACK_THANKS"` (Cảm ơn góp ý), `NOTIFICATION = "NOTIFICATION"` (Thông báo), `CUSTOM = "CUSTOM"` (Tùy chỉnh)
- **Các trường chính**:
  - `code`: `CharField(max_length=80)` (slug/mã template, VD: `feedback_thank_you`, `email_verification`, `password_reset`, `invitation`)
  - `name`: `CharField(max_length=150)`
  - `description`: `CharField(max_length=300, blank=True, default="")`
  - `locale`: `CharField(max_length=10, default="vi")` (`vi` / `en`)
  - `scope`: `CharField(max_length=20, choices=Scope.choices, default=Scope.PERSONAL)`
  - `category`: `CharField(max_length=30, choices=Category.choices, default=Category.CUSTOM)`
  - `status`: `CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)`
  - `owner`: `ForeignKey("system.User", null=True, blank=True, on_delete=CASCADE, related_name="email_templates")` (`None` khi `scope=SYSTEM`, là `actor` khi `scope=PERSONAL`)
  - `subject`: `CharField(max_length=200)` — hỗ trợ biến trộn `{{...}}`
  - `content`: `JSONField(default=dict)` — lưu **Tiptap JSON** chuẩn để mở lại chỉnh sửa trong `TiptapEditor`
  - `html_body`: `TextField(blank=True, default="")` — HTML sạch sinh từ Tiptap (lọc qua sanitizer trên BE) dùng để trộn biến & gửi email
  - `variables`: `JSONField(default=list)` — danh sách metadata trường trộn gợi ý (`[{"key": "sender_name", "label": "Tên người gửi", "example": "Nguyễn Văn A"}]`)
  - `is_system_default`: `BooleanField(default=False)` — đánh dấu mẫu mặc định được seed (chống xóa nhầm ở DB, chỉ cho phép sửa hoặc tắt `ARCHIVED`).
- **Ràng buộc `UniqueConstraint`**:
  - `UniqueConstraint(fields=["code", "locale"], condition=Q(deleted_at__isnull=True, scope="SYSTEM"), name="uniq_system_email_tpl_code_locale")`
  - `UniqueConstraint(fields=["owner", "code", "locale"], condition=Q(deleted_at__isnull=True, scope="PERSONAL"), name="uniq_personal_email_tpl_owner_code_locale")`

### 5.3 Tầng Repository, Service, View & Filter
- `PageFeedbackRepository` + `PageFeedbackService(CoreCrudService)` (`owner_field="target_owner"`, `manage_all_permission=PageFeedbackPermission.MANAGE_ALL.code`):
  - `submit_public(data, client_ip)`: xác thực `target_type` + `target_id`/`slug` có thật và đang `PUBLISHED`/`ACTIVE`, lưu góp ý, và gọi `NotificationService.notify(...)` tới `target_owner`.
  - `thank_sender(actor, feedback_id, data)`: kiểm tra quyền owner hoặc `manage_all`, trộn biến an toàn từ `EmailTemplate` (hoặc nội dung đã chỉnh trên dialog), gửi email đồng bộ timeout ≤ 5s qua `EmailService.send_now(...)`, cập nhật `status=RESOLVED` (nếu chưa), `thanked_at`, `thanked_by`, `thank_template`.
- `EmailTemplateRepository` + `EmailTemplateService(CoreCrudService)` (`owner_field="owner"`, `manage_all_permission=EmailTemplatePermission.MANAGE_ALL.code`):
  - **Override `list_queryset` / `get_object` / `create` / `update` / `delete`**:
    - Khi gọi `GET /system/email-templates`, actor thiếu `MANAGE_ALL` được override `list_queryset` để trả `(scope=SYSTEM & status=ACTIVE) OR (owner=actor)` (hỗ trợ lọc `?scope=SYSTEM|PERSONAL` hoặc `?category=FEEDBACK_THANKS`).
    - Khi `create`/`update`: nếu gửi `scope=SYSTEM` mà thiếu `EmailTemplatePermission.MANAGE_ALL` → trả `403 PERMISSION_DENIED`. Nếu có `MANAGE_ALL` và `scope=SYSTEM` → **ép `owner = None`** (tránh gán nhầm `owner=actor` làm sai `UniqueConstraint`).
    - Khi `update`/`delete`: Client (`MEMBER`) cố sửa/xóa template `scope=SYSTEM` (`owner=None`) hoặc template của người khác → trả `404` / `403` theo chuẩn `owner_isolation`.
  - `render_template(template, context)` & `preview(actor, template_id, context)`: escape HTML toàn bộ giá trị `context` (`html.escape`) trước khi thay `{{key}}` để chống HTML/XSS injection trong email!
  - `EmailTemplateSeedService`: seed 4 bộ template mặc định (`email_verification`, `password_reset`, `invitation`, `feedback_thank_you`) song ngữ `vi` / `en` theo cơ chế idempotent (`get_or_create`, không ghi đè mẫu Admin đã tùy chỉnh) trong `post_migrate` hoặc command `seed_email_templates`.
  - Tích hợp `EmailService.send_template`: ưu tiên tìm `EmailTemplate` `scope=SYSTEM, status=ACTIVE` trong DB theo `(code, locale)`; nếu chưa có hoặc lỗi thì fallback về file HTML/TXT sẵn có trong `system/templates/system/email/`.

---

## 6. Phân quyền, bảo mật, bí mật & tệp đính kèm

### 6.1 Quyền & `MEMBER`
| File quyền | Mã quyền | Có trong `MEMBER`? | Ghi chú |
| --- | --- | --- | --- |
| `utilities/permissions/page_feedback_permission.py` | `utilities.page_feedback.read`, `update`, `delete`, `thank`, `manage_all` | `READ`, `UPDATE`, `DELETE`, `THANK` (**KHÔNG** có `MANAGE_ALL`) | Chủ trang/link xử lý & gửi cảm ơn cho góp ý của mình; thiếu `manage_all` xem góp ý người khác trả `404`. |
| `system/permissions/email_template_permission.py` | `system.email_template.read`, `create`, `update`, `delete`, `manage_all` | `READ`, `CREATE`, `UPDATE`, `DELETE` (**KHÔNG** có `MANAGE_ALL`) | `MEMBER` tạo/sửa/xóa template `PERSONAL` của mình và đọc template `SYSTEM` đang `ACTIVE`; `MANAGE_ALL` tạo/sửa template `SYSTEM`. |

### 6.2 Bảo mật & ranh giới tin cậy
- **Chống spam & bảo vệ link bí mật ở endpoint công khai (`POST /utilities/public/feedbacks`)**:
  - Rate limit `UtilitiesRateLimitKey.FEEDBACK_SUBMIT` (khai trong `utilities/constants/utilities_rate_limit_key.py` và `settings.RATE_LIMITS`, VD: `5/m` theo IP).
  - Honeypot field (`website`, rỗng mới hợp lệ).
  - Chặn lộ thông tin nội bộ: chỉ nhận `target_type` + `target_id` (hoặc `slug`), trả response tối giản `{id, created_at}` (không trả `target_owner` hay email chủ trang ra ngoài!).
  - Với `ShortLink` có mật khẩu (`has_password=True`), chỉ dùng `target_url` công khai (`/s/{slug}`), tuyệt đối không phụ thuộc hay làm lộ `destination_url` khi chưa mở khóa.
- **Chống XSS / HTML Injection khi trộn biến Email**:
  - Mọi giá trị biến trộn (`sender_name`, `message`, `resolution_note`, `target_title`, `target_url`) đều đi qua `html.escape(val, quote=True)` khi thay vào `html_body`, và `target_url` kiểm tra scheme `http://`/`https://`.
  - `html_body` khi lưu vào `EmailTemplate` phải chạy sanitizer loại bỏ `<script>`, `<style>`, `<iframe>`, `on*`, `javascript:`.
- **Không lộ dữ liệu người khác (IDOR)**:
  - Truyền `?owner=<victim>` ở `GET /utilities/page-feedbacks` khi không có `manage_all` bị khóa cứng về `target_owner = actor`.
  - Mở chi tiết/sửa/xóa/gửi cảm ơn góp ý của người khác khi thiếu `manage_all` trả `404`.

---

## 7. Hợp đồng API & thông báo

### 7.1 Danh sách Endpoint (`/api/v1/...`)
| Method | Path | Quyền | Rate limit | Mô tả |
| --- | --- | --- | --- | --- |
| `POST` | `/utilities/public/feedbacks` | `AllowAny` | `UtilitiesRateLimitKey.FEEDBACK_SUBMIT` | Khách ẩn danh gửi góp ý/báo lỗi cho Custom Page hoặc ShortLink |
| `GET` | `/utilities/page-feedbacks` | `utilities.page_feedback.read` | `read` | Danh sách góp ý (Client thấy của mình; Admin `manage_all` thấy tất cả, lọc `status`, `feedback_type`, `target_type`, `owner`, ngày) |
| `GET/PATCH/DELETE` | `/utilities/page-feedbacks/{id}` | `read` / `update` / `delete` | `write` | Xem chi tiết, cập nhật trạng thái/ghi chú xử lý, xóa mềm (`bulk_delete_enabled=True`) |
| `POST` | `/utilities/page-feedbacks/{id}/thank` | `utilities.page_feedback.thank` | `write` | Gửi email cảm ơn người góp ý (chọn `template_id` hoặc nội dung tùy chỉnh) |
| `POST` | `/utilities/page-feedbacks/bulk-update` | `utilities.page_feedback.update` | `write` | Đổi trạng thái hàng loạt (`OPEN` / `IN_PROGRESS` / `RESOLVED` / `IGNORED`) |
| `GET/POST` | `/system/email-templates` | `system.email_template.read` / `create` | `read` / `write` | Danh sách & tạo mẫu email (`scope=PERSONAL` hoặc `SYSTEM` nếu có `manage_all`) |
| `GET/PATCH/DELETE` | `/system/email-templates/{id}` | `read` / `update` / `delete` | `write` | Chi tiết, sửa Tiptap/trường trộn/trạng thái, xóa (`bulk_delete_enabled=True`) |
| `POST` | `/system/email-templates/bulk-update` | `system.email_template.update` | `write` | Bật/tắt trạng thái hàng loạt (`ACTIVE` / `DRAFT` / `ARCHIVED`) |
| `POST` | `/system/email-templates/{id}/duplicate` | `system.email_template.create` | `write` | Nhân bản mẫu `SYSTEM` thành mẫu `PERSONAL` của user |
| `POST` | `/system/email-templates/{id}/preview` | `system.email_template.read` | `read` | Xem trước email sau khi trộn biến mẫu |

### 7.2 Sự kiện thông báo (`NotificationService.notify`)
- Tạo `backend/app/utilities/constants/utilities_notification_event.py` (`UtilitiesNotificationEvent.FEEDBACK_RECEIVED = "utilities.feedback.received"`) và khai báo trong `utilities/module.py` (`scope=PERSONAL`, `audience=OWNER`, `permission=PageFeedbackPermission.READ.code`, `default_channels=(IN_APP, PUSH, TELEGRAM)`, `icon="🐞"`), `details` chứa `target_title`, `feedback_type`, `target_url`, liên kết thẳng tới `/ca-nhan/gop-y/{id}` (hoặc `/quan-tri/tien-ich/gop-y/{id}`).
- `RateLimitKey`: thêm `FEEDBACK_SUBMIT` vào `UtilitiesRateLimitKey` (`utilities/constants/utilities_rate_limit_key.py`) và đăng ký vào `settings.RATE_LIMITS`.

---

## 8. Kiến trúc Frontend, UI/UX & i18n

### 8.1 Public Widget (`PublicFeedbackWidget` — chỉ ở Custom Page & ShortLink)
- `frontend/src/modules/utilities/components/feedback/public-feedback-widget.tsx` + `hooks/use-public-feedback-widget.ts`:
  - Nút tròn nổi ở góc dưới-trái (`left-4 bottom-4`) với icon/avatar góp ý từ `public/icons/`.
  - Gắn duy nhất tại `PublicPage` (`components/page/public-page.tsx`) và `ShortLinkLandingCard` (`components/short-link/short-link-landing-card.tsx`). Trên `ShortLinkLandingCard`, gửi `targetType="SHORT_LINK"`, `slug`, và `targetUrl` là URL công khai `/s/{slug}` (không phụ thuộc trạng thái mở khóa mật khẩu).
  - Popup form gọn gàng: chọn Loại lỗi (`Sai link / Link hỏng`, `Sai thông tin`, `Lỗi hiển thị`, `Góp ý`), chọn sản phẩm cụ thể (nếu là trang Affiliate), nhập nội dung, tùy chọn Tên & Email nhận lời cảm ơn.

### 8.2 Trang quản lý Góp ý (Admin & Client Portal)
- **Routes & Navigation**:
  - Admin: `/quan-tri/tien-ich/gop-y` ↔ `/admin/utilities/feedbacks` (và `[id]`), thêm vào `utilitiesNavigation` (cụm `utilities.navSections.content`, giữ các mục cùng cụm liền nhau).
  - Portal: `/ca-nhan/gop-y` ↔ `/portal/feedbacks` (và `[id]`), thêm vào `PORTAL_NAV_SECTIONS` (`modules/portal/constants/navigation.ts`).
- **Danh sách (`DataTable`)**:
  - Cột: Đối tượng (`Page`/`ShortLink` + link mở nhanh), Loại lỗi (`Badge`), Nội dung tóm tắt, Người gửi (`senderName || "Ẩn danh"` + `senderEmail`), Chủ sở hữu (`formatOwnerDisplayName` — chỉ hiện ở Admin), Trạng thái (`OPEN` / `IN_PROGRESS` / `RESOLVED` / `IGNORED`), Đã cảm ơn (`thankedAt`), Thời gian (`<TimestampText />`).
  - Bộ lọc (`FilterSelect` + `useTableState` lưu URL): Trạng thái, Loại lỗi, Đối tượng (`PAGE` / `SHORT_LINK`), **Người sở hữu (`owner`)** (chỉ hiện khi có `manage_all`).
  - Cột Thao tác: Xem / Sửa / Xóa (`can={{ update, delete }}`) + nút nhanh **Gửi lời cảm ơn** (khi có `senderEmail` và quyền `thank`).
- **Trang chi tiết `[id]`**:
  - Dùng `FormPage`, `useEditMode` + `EditModeProvider` (mặc định chỉ xem), `RecordDetailTabs` + tab `history` (`JournalTracker`).
  - Khung **Thông tin lỗi & liên kết kiểm tra**: bấm mở tab mới tới đúng trang/sản phẩm lỗi để kiểm tra và sửa.
  - Khung **Xử lý & Ghi chú**: đổi trạng thái sang `Đã xử lý` (`RESOLVED`), nhập `resolutionNote`.
  - Nút **Cảm ơn người góp ý**: mở `FeedbackThankDialog` — tự động nạp danh sách template `FEEDBACK_THANKS` (`PERSONAL` của user + `SYSTEM` `ACTIVE`), cho chọn mẫu, xem trước nội dung đã trộn biến và bấm **Gửi email cảm ơn**.

### 8.3 Trang quản lý Template Email (Admin & Client Portal)
- **Routes & Navigation**:
  - Admin: `/quan-tri/he-thong/mau-email` ↔ `/admin/system/email-templates` (tạo/sửa template `SYSTEM` & xem/lọc theo `scope`, `status`, `category`), thêm vào `systemNavigation` (cụm `system.navSections.notifications`, giữ các mục cùng cụm liền nhau).
  - Portal: `/ca-nhan/mau-email` ↔ `/portal/email-templates` (xem template `SYSTEM` `ACTIVE` + quản lý CRUD template `PERSONAL` của riêng mình, hỗ trợ nút **Nhân bản** mẫu hệ thống), thêm vào `PORTAL_NAV_SECTIONS` (`modules/portal/constants/navigation.ts`).
- **Form tạo/sửa Template (`FormPage` + `TiptapEditor`)**:
  - Trường: `name`, `code`, `category`, `locale` (`vi`/`en`), `status` (`ACTIVE`/`DRAFT`/`ARCHIVED`), `scope` (`SYSTEM` chỉ mở khi có `manage_all`, mặc định `PERSONAL`), `subject` (hỗ trợ chèn biến `{{...}}`).
  - Nội dung email dùng `TiptapEditor` kèm plugin **Chèn trường trộn (`{{sender_name}}`, `{{target_title}}`, `{{target_url}}`, `{{resolution_note}}`...)** và nút **Xem trước với dữ liệu mẫu**.

### 8.4 i18n & Token màu
- Khai báo đầy đủ khóa dịch `vi.json` & `en.json` ở `modules/utilities/messages/` (`pageFeedbacks`, `publicFeedback`) và `modules/system/messages/` (`emailTemplates`), cùng `errors.UTILITIES_*` / `errors.SYSTEM_*` trong `src/messages/{vi,en}.json`, và khai báo prefix dịch nhật ký thay đổi cho 2 model mới trong `frontend/src/shares/constants/journal-field-prefixes.ts`.
- Dùng token màu `--color-*` có sẵn (`--color-warning`, `--color-success`, `--color-info`, `--color-destructive`, `--color-primary`); nếu thêm token mới thì khai đồng bộ ở `:root`, `.dark`, `@theme inline` của `globals.css`.

---

## 9. Xử lý biên, lỗi & fallback

| Tình huống biên / lỗi | Hành vi xử lý BE & FE | Mã lỗi / Thông điệp |
| --- | --- | --- |
| Khách gửi góp ý liên tục (spam) | Chặn theo IP qua `rate_limit` | HTTP `429` + thông báo chờ thử lại |
| Trang / ShortLink đã bị ẩn hoặc xóa | Không nhận góp ý công khai | HTTP `404` `UTILITIES_TARGET_NOT_FOUND` |
| Gửi cảm ơn cho góp ý không có `sender_email` | Vô hiệu nút + kiểm tra BE trả 422 | `UTILITIES_FEEDBACK_NO_EMAIL` |
| Gửi cảm ơn lại lần 2 | Hiển thị cảnh báo đã cảm ơn lúc `<TimestampText />`, cho phép xác nhận trước khi gửi lại | `ConfirmDialog` |
| Không có template `SYSTEM` trong DB | `EmailService.send_template` tự fallback về file `system/email/*.html` | Không gián đoạn email hệ thống |
| Client sửa/xóa template `scope=SYSTEM` | BE trả 403/404; FE ẩn/khóa nút sửa/xóa và gợi ý nút **Nhân bản** | `PERMISSION_DENIED` |

---

## 10. Kế hoạch kiểm thử

- **Backend (`pytest --reuse-db` trên PostgreSQL local)**:
  - `app/utilities/tests/test_page_feedback_public_api.py`: gửi góp ý ẩn danh cho Page & ShortLink, validate input, honeypot, rate limit `429`, kiểm tra bắn `NotificationService.notify` tới đúng `target_owner`.
  - `app/utilities/tests/test_page_feedback_list_api.py`: phân quyền 401/403, `owner_isolation` (Client chỉ thấy của mình, khóa `?owner=`), Admin `manage_all` thấy tất cả + lọc đa điều kiện, `test_list_query_count`.
  - `app/utilities/tests/test_page_feedback_thank_api.py`: gửi email cảm ơn với template `PERSONAL`/`SYSTEM`, escape HTML biến trộn chống XSS, chặn thiếu email (`422`), chặn `owner_isolation` (`404`).
  - `app/system/tests/test_email_template_api.py`: CRUD `SYSTEM` vs `PERSONAL`, `duplicate`, `preview`, `bulk-update`, `bulk-delete`, seed template mặc định.
  - `app/core/tests/test_endpoint_access.py`, `test_one_class_per_file.py`, `test_module_conventions.py`, `test_openapi_schema.py`.
- **Frontend (`vitest` & `playwright-cli`)**:
  - Unit tests: `public-feedback-widget.test.tsx`, `page-feedback-table.test.tsx`, `email-template-form.test.tsx`, kèm `one-unit-per-file`, `module-structure`, `table-conventions`, `messages`, `code-conventions`, `api-contract`.
  - E2E & UI thật (`playwright-cli`): mở trang Custom Page & ShortLink công khai → gửi góp ý ẩn danh → đăng nhập Client kiểm thông báo ở Hồ sơ & `/ca-nhan/gop-y` → xử lý xong bấm **Cảm ơn** → kiểm tra trang `/quan-tri/tien-ich/gop-y` và `/quan-tri/he-thong/mau-email` ở `/vi` & `/en`, desktop & mobile `375px`.

---

## 11. Lộ trình từng giai đoạn & cập nhật tài liệu

1. **Phase 1 — DB & Backend EmailTemplate (`system`)**: Model `EmailTemplate` + migration, seed 4 template mặc định (gồm `feedback_thank_you`), CRUD/Duplicate/Preview API, tích hợp fallback vào `EmailService`, `pytest`.
2. **Phase 2 — DB & Backend PageFeedback (`utilities`)**: Model `PageFeedback` + migration, API công khai gửi góp ý + thông báo `NotificationService.notify`, API quản lý/lọc/xử lý/gửi cảm ơn, `pytest`, `spectacular`, `pnpm api:types`.
3. **Phase 3 — Frontend (`system` + `utilities` + `portal`)**:
   - `PublicFeedbackWidget` trên `PublicPage` & `ShortLinkLandingCard`.
   - Màn quản lý `EmailTemplate` (Admin & Portal) tích hợp `TiptapEditor` + trường trộn.
   - Màn quản lý `PageFeedback` (Admin có filter `owner` & Portal) + hộp thoại **Cảm ơn** chọn template gửi email.
4. **Phase 4 — Kiểm thử & Tài liệu**:
   - Cập nhật `docs/modules/utilities/README.md`, `docs/modules/system/README.md`, `docs/common-catalog.md`, `docs/README.md`.
   - Chạy bộ test quy ước, unit test, `playwright-cli` đa vai trò & `/vi`/`/en`.
