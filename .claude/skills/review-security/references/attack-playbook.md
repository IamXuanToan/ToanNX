# Playbook giả lập tấn công (AppSec Simulation) cho ToanNX

Tất cả ví dụ dưới đây chỉ chạy trên **PostgreSQL test local (`pytest --reuse-db`)** hoặc **môi trường local dev/E2E (`localhost`)**. Không bao giờ chạy lên production.

## Ma trận tấn công chuẩn

| Mã nhóm | Kịch bản giả lập (Payload / Request) | Cơ chế bảo vệ mục tiêu | Kỳ vọng an toàn bắt buộc |
| --- | --- | --- | --- |
| `AUTH-01` | Sửa payload JWT đổi `sub`/`sid`, ký bằng `"alg": "none"` hoặc secret rác | `CookieJwtAuthentication` | Trả 401 `AUTH_TOKEN_INVALID`, không fallback qua session ẩn |
| `AUTH-02` | Thu hồi phiên qua `/sessions/{id}` hoặc `logout-all`, rồi dùng tiếp `access_token` cũ trong 10 phút đầu | Kiểm tra `AuthSession` còn sống trên mọi request | Trả 401 ngay lập tức |
| `AUTH-03` | Xoay vòng `refresh_token` lần 1 (hợp lệ), đợi qua grace period rồi replay `refresh_token` cũ | `RefreshTokenService` reuse detection | Trả 401 `AUTH_REFRESH_REUSED` + thu hồi **toàn bộ** phiên đó + xóa cookie |
| `AUTH-04` | Gửi cookie giả `session_hint=1` vào `/vi/quan-tri` hoặc gọi thẳng API `/api/v1/system/users` | `proxy.ts` chỉ kiểm lạc quan; `DEFAULT_PERMISSION_CLASSES` ở BE | API trả 401; FE chuyển về `/vi/dang-nhap` khi gọi `/me` lỗi |
| `AUTH-05` | Vượt quá 10 lần sai mật khẩu `/login` từ cùng email+IP | `system_rate_limit_bucket` + `BucketThrottle` | Trả 429 + header `Retry-After` |
| `CSRF-01` | Dùng `csrf_client` (có `enforce_csrf_checks=True`) gửi `POST/PATCH/DELETE` có cookie phiên nhưng thiếu/sai `X-CSRFToken` hoặc giả `Origin: https://evil.example` | `CsrfProtected` & Django CsrfViewMiddleware | Trả 403 (`AUTH_CSRF_FAILED` / CSRF fail) |
| `IDOR-01` | User B (`*_MEMBER`) gọi `GET/PATCH/DELETE/{id}`, `duplicate`, `{id}/history` lên bản ghi của User A | `CoreCrudService` (`owner_field` + thiếu `manage_all`) | **404 `NOT_FOUND`** (không lộ 403 để tránh dò ID) |
| `IDOR-02` | User B (không có `manage_all`) gửi `GET /finance/incomes?owner=<userA_id>&owners=<userA_id>` | Filter `owner` / Repository queryset scoping | Không trả bản ghi của User A (0 kết quả của A) |
| `IDOR-03` | User B gọi `POST /bulk-delete` hoặc `/bulk-update` kèm lẫn UUID của User A và của mình | Bulk service `get_for_write` / `filter(owner=actor)` trong transaction | Thất bại nguyên khối transaction (404), không xóa nhầm bản ghi của User A |
| `IDOR-04` | User có `*.read` nhưng thiếu `*.export` / `*.update` / `*.delete` gọi thẳng API tương ứng | View `action_permissions` / `@require_permission` | Trả 403 `PERMISSION_DENIED` |
| `PRIVESC-01` | Staff thường (có `system.user.update`, không phải superuser) PATCH `is_superuser: true` hoặc sửa thông tin superuser | `UserService` (`ACCOUNT_PRIVILEGE_ESCALATION`, `ACCOUNT_SUPERUSER_PROTECTED`) | Trả 403 + không đổi cờ trong DB |
| `PRIVESC-02` | User tự sửa `is_active`/`is_staff` của chính mình hoặc tự gán role cho chính mình | `UserService` / `UserRoleService` (`*_SELF_MODIFICATION`) | Trả 403 + bảo toàn DB |
| `PRIVESC-03` | Admin cấp thấp có `system.role.assign` cố gán role chứa quyền mình không có (`IAM_PRIVILEGE_ESCALATION`) | `UserRoleService` & `RolePermissionService` | Trả 403 + không gán được |
| `MASS-01` | Gửi field nhạy cảm không khai báo (`owner`, `created_by`, `deleted_at`, `sepay_id`, `role_ids`) vào POST/PATCH | `CoreValidateSerializer` (`validate` chặn unknown fields) | Trả 400/422 validation error, không ghi đè DB |
| `FILE-01` | Upload payload HTML/PHP giả đuôi `.png`, hoặc SVG chứa `<script>`, `onload=`, `<foreignObject>`, `href="javascript:..."` | `AttachmentService` kiểm magic bytes / SVG sanitizer | Bị từ chối 400/422; không phục vụ inline XSS |
| `FILE-02` | Upload XML chứa `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>` | `defusedxml` parser | Bị chặn, không đọc file local / không DoS Billion Laughs |
| `FILE-03` | User B (không `read_private`) gọi `/api/v1/system/attachments/{id_private_cua_A}/content`; hoặc kiểm JSON serializer chứng từ/hóa đơn xem có rò URL R2 trực tiếp | `AttachmentContentView` + serializer private file | Content trả 404; serializer chỉ trả path `/content`, không trả URL storage |
| `HOOK-01` | Gửi `POST /api/v1/finance/sepay/webhook/{public_id}` sai chữ ký HMAC, thân bị sửa, hoặc timestamp cũ > 300s | `SepayWebhookView` + `hmac.compare_digest` | Từ chối xác thực (401/403) + không ghi `Income` / `DonationTransaction` |
| `CRON-01` | Gọi `POST /api/v1/system/health/cleanup` hoặc `/system/notifications/dispatch` thiếu/sai `CRON_SECRET` | `CronSecret` verification (`hmac.compare_digest`) | Từ chối 401/403 |
| `WEB-01` | Truyền `?next=//evil.com`, `?next=https://evil.com`, `?next=/\evil.com` lúc login/redirect; hoặc tạo `ShortLink` có `destination_url="javascript:alert(1)"` | `sanitizeNextPath`, BE URL validator (`http://` / `https://`) | Loại bỏ open redirect (rơi về `/quan-tri` hoặc `/`) và chặn URL `javascript:`/`data:` |
| `WEB-02` | Nhập payload ReDoS `(a+)+$` kèm input `"aaaaaaaaaaaaaaaaaaaa!"` vào `ClassificationRule` | Thư viện `regex` với timeout cấu hình | Không treo CPU worker, lỗi validate hoặc timeout sạch |
| `WEB-03` | Chèn `</script><script>alert(1)</script>` vào dữ liệu Page/Novel render JSON-LD hoặc `TiptapContent` | Escape `</script` trong JSON-LD + `TiptapContent` chỉ render AST hợp lệ | Không thực thi script trên trình duyệt (kiểm qua Playwright) |
