# Xác nhận bảo mật hệ thống — ToanNX

- **Cập nhật gần nhất**: `2026-11-25 16:42`
- **Phạm vi đã kiểm**: Toàn hệ thống BE (`core`, `system`, `finance`, `utilities`, `novel`) và FE (`src/proxy.ts`, `next.config.ts`, `modules/system`, `modules/utilities`, `modules/finance`, `modules/portal`, `shares`) theo các vector tấn công của `/review-security`, `/permission-audit`, `/i18n-audit`, `/review-code`.
- **Môi trường kiểm nghiệm**: PostgreSQL local (`--reuse-db`), `ruff check app/` + `mypy app/` (786 file), Django pytest (`242 passed` trên 34 file test), Next.js 16 `eslint --max-warnings 0` + `pnpm typecheck` + Vitest (`27` file / `618 passed`), `playwright-cli` đa vai trò (`FINANCE_VIEWER`, `portal.member`) & `/vi` ↔ `/en` trên server dev `localhost:3001`.

## 1. Bảng các case bảo mật & giả lập tấn công

| Mã | Nhóm | Đối tượng (Endpoint / File) | Vector tấn công giả lập | Test hồi quy khóa cứng | Trạng thái | Lần kiểm |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-AUTH-01 | AuthN / Token | `/api/v1/system/auth/refresh` | Replay refresh token đã xoay vòng / sai phiên | `app/system/tests/test_refresh_api.py` | PASS | 2026-11-25 |
| SEC-AUTH-02 | CSRF | API đổi trạng thái dùng cookie (`POST /logout`, `POST /password-reset/request`) | Request ghi không kèm `X-CSRFToken` / Origin sai | `app/system/tests/test_csrf_api.py` | PASS | 2026-11-25 |
| SEC-AUTH-03 | Origin / Host Poisoning | `/api/v1/system/auth/password-reset/request`, xác minh email | Gửi header `Origin` / `Referer` giả (`https://evil-attacker.test`) để đánh cắp token qua link trong email | `app/system/tests/test_password_reset_request_api.py` | PASS | 2026-11-25 |
| SEC-AUTH-04 | OAuth Open Redirect | `/api/v1/system/auth/social/<provider>/url` | Truyền `redirect_uri=https://evil-attacker.test/callback` ngoài danh sách origin tin cậy | `app/system/tests/test_social_auth_url_api.py` | PASS | 2026-11-25 |
| SEC-IDOR-01 | IDOR / Owner Scope | `/api/v1/finance/incomes`, `/api/v1/finance/reports/summary` | Người dùng thường truyền `?owner=<victim>` hoặc sửa/xóa bản ghi người khác | `app/finance/tests/test_income_api.py` | PASS | 2026-11-25 |
| SEC-IDOR-02 | IDOR / Input Validation | `/api/v1/utilities/donations`, `/api/v1/utilities/donations/stats` | Truyền `?owner=<victim>` không có `manage_all`, hoặc `?owner=not-a-uuid` / `date_from=invalid` gây lỗi 500 | `app/utilities/tests/test_donation_list_api.py`, `app/utilities/tests/test_donation_stats_api.py` | PASS | 2026-11-25 |
| SEC-IAM-01 | Leo thang quyền | `/api/v1/system/users/<id>/roles`, `test_endpoint_access` | Gán vai trò có quyền vượt quá tập quyền của chính actor; truy cập route quản trị khi thiếu quyền | `app/system/tests/test_user_role_assign_api.py`, `app/core/tests/test_endpoint_access.py` | PASS | 2026-11-25 |
| SEC-FILE-01 | Private Files & Upload | `/api/v1/system/attachments`, `/api/v1/system/attachments/{id}/content` | Người ngoài mở file riêng tư (phải trả 404 đồng nhất); giả mạo `Content-Type` ảnh; upload XML có DTD | `app/system/tests/test_attachment_visibility_api.py`, `app/system/tests/test_attachment_content_api.py`, `app/system/tests/test_attachment_create_api.py` | PASS | 2026-11-25 |
| SEC-FILE-02 | SVG XSS & Disposition | `svg_inspector.py`, `GET /api/v1/system/attachments/{id}/content` | Upload SVG chứa SMIL (`<set>`, `<animate onbegin=...>`), `data:text/html`, `-moz-binding`; mở SVG riêng tư inline | `app/system/tests/test_attachment_create_api.py`, `app/system/tests/test_attachment_content_api.py` | PASS | 2026-11-25 |
| SEC-HOOK-01 | Secret Leak & Spoofing | `GET /api/v1/utilities/pages/public/<segment>/<slug>`, `POST /api/v1/utilities/donations/webhook/<token>` | Lộ `webhookToken`/`webhook_token` qua trang Donate công khai; giả mạo `transferType="out"`, số tiền `<= 0` hoặc dùng lại `sepay_id` chéo trang | `app/utilities/tests/test_page_public_api.py` (`test_public_donation_page_strips_secret_webhook_tokens`), `app/utilities/tests/test_donation_webhook_api.py` | PASS | 2026-11-25 |
| SEC-HOOK-02 | Webhook HMAC & Cron Secret | `/api/v1/finance/sepay/webhook/<id>`, `/api/v1/system/internal/cleanup`, `/notifications/dispatch` | Sai chữ ký / timestamp quá hạn / sai `CRON_SECRET` hoặc `Upstash-Signature` | `app/finance/tests/test_sepay_webhook_api.py`, `app/system/tests/test_cleanup.py`, `app/system/tests/test_notification_dispatch_api.py` | PASS | 2026-11-25 |
| SEC-INJ-01 | CSV Formula Injection | `GET /api/v1/finance/incomes/export`, `GET /api/v1/utilities/donations/export` | Chèn `=cmd\|...`, `+SUM(...)`, `-2+3`, `@IMPORTXML(...)`, `\t=...` vào nội dung/ghi chú/tên trang để thực thi DDE khi mở Excel | `app/core/tests/test_csv_safety.py`, `app/finance/tests/test_income_export_api.py`, `app/utilities/tests/test_donation_export_api.py` | PASS | 2026-11-25 |
| SEC-SSRF-01 | SSRF & DNS Rebinding | `SafeHttpClient`, `PinnedHttpAdapter` | Bypass qua IPv4-mapped IPv6 (`::ffff:127.0.0.1`), NAT64 (`64:ff9b::127.0.0.1`), 6to4, CGNAT, biến môi trường proxy, DNS Rebinding giữa lúc check và connect | `app/core/tests/test_safe_http_client.py` | PASS | 2026-11-25 |
| SEC-FE-01 | Edge Proxy DoS | `frontend/src/proxy.ts` (`matchPublicPage`) | Gửi URL percent-encoding hỏng `/%ZZ/test`, `/%E0%A4%A/donate` làm sập `decodeURIComponent` gây HTTP 500 | `frontend/tests/unit/security-controls.test.ts` + HTTP live `:3001/%ZZ/test -> 307` | PASS | 2026-11-25 |
| SEC-FE-02 | Open Redirect & DOM XSS | `sanitizeNextPath`, `toSafeHttpUrl`, `toSafeImageSrc`, `bio/affiliate/donation/short-link` | Bypass redirect bằng `/\t/evil.com`, `/\n/evil.com`, `/\\evil.com`; chèn `javascript:`, `vbscript:`, `data:text/html` vào link Bio/Affiliate/ShortLink/QR | `frontend/tests/unit/security-controls.test.ts`, `frontend/tests/unit/auth-service.test.ts` | PASS | 2026-11-25 |
| SEC-FE-03 | Image Optimizer SSRF | `frontend/next.config.ts` (`dangerouslyAllowLocalIP`, `remotePatterns`) | Chặn `dangerouslyAllowLocalIP` và `http://localhost`/`127.0.0.1` trong `remotePatterns` khi chạy production | `NEXT_DIST_DIR=.next-verify pnpm build` | PASS | 2026-11-25 |
| SEC-FE-04 | Safe External Open & OAuth Redirect | `donation-table.tsx`, `page-table.tsx`, `use-login-form.ts`, `use-profile-dialog.ts` | Bọc `window.open` / `window.location.href` bằng `toSafeHttpUrl` + `"noopener,noreferrer"` chống tabnabbing và `javascript:` URL | `frontend/tests/unit/donation-table.test.tsx`, `frontend/tests/unit/security-controls.test.ts` | PASS | 2026-11-25 |
| SEC-FE-05 | OAuth Callback & Portal Safe Links | `use-social-auth-callback.ts`, `portal-dashboard.tsx` | Người dùng non-staff bấm "Chuyển hướng ngay" bị đưa sang `/admin`; `p.publicUrl` chưa lọc qua `toSafeHttpUrl` | Kiểm `isStaffTarget` + dùng `nextRouter.replace` cho `next`; bọc `p.publicUrl` qua `toSafeHttpUrl` | `frontend/tests/unit/social-auth-callback-view.test.tsx`, `playwright-cli` | PASS | 2026-11-25 |
| SEC-INP-01 | Public Feed Query Validation | `backend/app/utilities/views/donation_public_feed_view.py` | Gửi `?limit=abc` / `?page=xyz` lên endpoint công khai `AllowAny` gây `ValueError` (HTTP 500) | Parse qua `_parse_positive_int` trả 400 `VALIDATION_ERROR` | `backend/app/utilities/tests/test_donation_public_feed_api.py` | PASS | 2026-11-25 |

## 2. Lỗi đã phát hiện & đã xử lý trong kỳ

| Mã | Mức độ | Vị trí (`file:dòng`) | Nguyên nhân & PoC | Cách vá | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| SEC-01 | High | `backend/app/utilities/services/page_service.py`, `donation_transaction_service.py:82` (`ingest_webhook`) | `PageService._load_public` trả nguyên `content_config` gồm `webhookToken`/`webhook_token`; kẻ tấn công lấy token từ API công khai rồi POST webhook giả mạo quyên góp âm/tiền ra và đồng bộ sang thu nhập Finance; `ingest_webhook` dùng `==` thường và không chặn `sepay_id` chéo trang. | Thêm `_strip_qr_secrets` áp dụng cho cả `_load_public` lẫn `duplicate`; đổi sang `hmac.compare_digest`; bắt buộc `transferType == "in"` (nếu có), `transferAmount > 0` và chặn `sepay_id` tái sử dụng khác trang; dùng CSPRNG trong `use-page-donation-qr-dialog.ts`; tách truy vấn ORM qua `PageRepository` và `DonationTransactionRepository`. | FIXED & VERIFIED |
| SEC-02 | High | `backend/app/system/utils/frontend_url.py`, `password_reset_service.py:60`, `email_verification_service.py:67`, `oauth_service.py:88` | `get_frontend_origin` tin bất kỳ header `Origin`/`Referer` nào gửi tới `POST /password-reset/request` (`AllowAny`), cho phép đầu độc link reset mật khẩu chứa `uid`/`token` trỏ tới domain kẻ tấn công; `OAuthService.get_authorization_url` không kiểm allowlist `redirect_uri`. | Bổ sung `trusted_frontend_origins()` & `is_trusted_frontend_origin()` lấy từ `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`; bỏ qua `Origin`/`Referer` ngoài danh sách, ưu tiên `FRONTEND_URL` cho email xác thực/đặt lại mật khẩu; chặn `redirect_uri` ngoài allowlist trong `OAuthService`. | FIXED & VERIFIED |
| SEC-03 | High | `frontend/src/proxy.ts:93-109` | `matchPublicPage` gọi `decodeURIComponent(part)` không bắt ngoại lệ `URIError`, khiến request `/%ZZ/test` có thể ném lỗi runtime 500 tại lớp proxy. | Bọc `decodeURIComponent` bằng `try/catch` trả về `null` khi chuỗi percent-encoding không hợp lệ. | FIXED & VERIFIED |
| SEC-04 | Medium | `frontend/src/modules/system/services/auth.service.ts:26-41` | `sanitizeNextPath` không lọc ký tự điều khiển/tab/newline (`/\t/evil.com`, ` \n//evil.com`), có thể bị trình duyệt chuẩn hóa thành protocol-relative redirect ra ngoài. | Chặn khoảng trắng đầu/cuối, mọi ký tự điều khiển `[\u0000-\u001f\u007f\\]`, `//` và kiểm tra lại bằng `new URL(next, "https://app.invalid")`. | FIXED & VERIFIED |
| SEC-05 | Medium | `frontend/src/shares/lib/safe-url.ts`, `affiliate-page-renderer.tsx`, `bio-page-renderer.tsx`, `donation-page-renderer.tsx`, `page-affiliate-item-row.tsx`, `page-bio-editor.tsx`, `use-short-link-landing.ts` | Liên kết sản phẩm Affiliate, link/dự án/website Bio, nguồn ảnh QR tùy chỉnh và đích ShortLink được truyền thẳng vào `<Link href>` / `window.location.assign` mà không kiểm scheme, dễ dẫn tới DOM XSS (`javascript:`/`data:text/html`). | Tạo common `toSafeHttpUrl` & `toSafeImageSrc` trong `src/shares/lib/safe-url.ts` (đã cập nhật `docs/common-catalog.md`) và bọc toàn bộ renderer, editor liên quan cùng hook chuyển hướng ShortLink. | FIXED & VERIFIED |
| SEC-06 | Medium | `backend/app/core/utils/csv_safety.py`, `income_service.py`, `donation_transaction_service.py:336` (`export_csv`) | Xuất CSV Thu nhập & Quyên góp ghi thẳng dữ liệu người dùng nhập (`content`, `note`, `reference_code`, `donor_title`, `message`, `page.title`) không trung hòa ký tự mở đầu công thức. | Tạo common `sanitize_csv_cell` / `sanitize_csv_row` (đã cập nhật `docs/common-catalog.md`), gắn tiền tố `'` cho chuỗi bắt đầu bằng `= + - @ \t \r \n` (kể cả sau khoảng trắng). | FIXED & VERIFIED |
| SEC-07 | Medium | `backend/app/core/utils/safe_http_client.py` (trước đây ở `app/utilities/utils/`), `pinned_http_adapter.py`, `frontend/next.config.ts:40` | `is_ip_allowed` thiếu kiểm tra `ipv4_mapped`, `sixtofour`, `teredo`, `is_global`, `64:ff9b::/96` và không tắt `trust_env`; `fetch_html` phân giải DNS 2 lần (cửa sổ DNS Rebinding); `next.config.ts` bật `dangerouslyAllowLocalIP: true` cả ở production. | Bổ sung unwrap IPv4-mapped/6to4/Teredo + `is_global`; tạo `PinnedHttpAdapter` ghim TCP/TLS SNI vào đúng IP đã kiểm tra và tắt `trust_env`; chuẩn hóa về `app/core/utils/` để dùng chung cho Uptime Monitor & Utilities; khóa `dangerouslyAllowLocalIP: isDev` và tách `localhost`/`127.0.0.1` `remotePatterns` chỉ cho `isDev`. | FIXED & VERIFIED |
| SEC-08 | Medium | `backend/app/system/utils/svg_inspector.py`, `attachment_storage_service.py:23` | `svg_inspector` chưa chặn thẻ SMIL (`animate`, `animatetransform`, `animatemotion`, `set`), thuộc tính `from`/`to`/`values`/`src` chứa `javascript:`/`data:text/html` và `-moz-binding`; `DOWNLOAD_ONLY_CONTENT_TYPES` chưa gồm `image/svg+xml`. | Mở rộng `_FORBIDDEN_TAGS`, kiểm tra giá trị sau khi loại khoảng trắng/ký tự điều khiển và bổ sung `image/svg+xml` vào `DOWNLOAD_ONLY_CONTENT_TYPES` để trả `Content-Disposition: attachment` khi phục vụ qua API. | FIXED & VERIFIED |
| SEC-09 | Low | `backend/app/utilities/services/donation_transaction_service.py:390-405` (`_parse_uuid`, `_parse_datetime_filter`) | Endpoint `/utilities/donations/stats` truyền thẳng `owner_id`/`page_id`/`date_from`/`date_to` vào `.filter()`, gặp UUID/ngày sai định dạng gây lỗi 500 thay vì 400. | Bổ sung `_parse_uuid` và `_parse_datetime_filter` ném `ValidationError` (HTTP 400). | FIXED & VERIFIED |
| SEC-10 | Low | `donation-table.tsx`, `page-table.tsx`, `use-login-form.ts`, `use-profile-dialog.ts`, `portal-dashboard.tsx` | Đường dẫn CSV export, URL công khai mở bằng `window.open` thiếu `"noopener,noreferrer"` hoặc chưa bọc `toSafeHttpUrl`; chuyển hướng OAuth `authorizationUrl` gán trực tiếp `window.location.href`. | Bọc qua `toSafeHttpUrl` (chặn relative/ngoại lai cho OAuth bằng `allowRelative: false`) và thêm `"noopener,noreferrer"` cho `window.open`. | FIXED & VERIFIED |
| SEC-11 | Low | `backend/app/utilities/views/donation_public_feed_view.py:37-49`, `frontend/src/modules/system/components/auth/hooks/use-social-auth-callback.ts` | Endpoint công khai `/donations/feed` dùng `int()` trực tiếp trên `limit`/`page` gây 500 khi truyền chuỗi; `useSocialAuthCallback` ở nút chuyển ngay đẩy user non-staff sang `/admin`. | Thêm `_parse_positive_int` trả `ValidationError` 400 kèm `test_donation_public_feed_api.py`; lưu `isStaffTarget` để `handleRedirectNow` điều hướng đúng `/portal` và dùng `nextRouter.replace` cho `next`. | FIXED & VERIFIED |

## 3. Lệnh tái xác nhận tự động (dùng cho các lần `/review-security` sau)

> Chạy trên PostgreSQL local (tuyệt đối không trỏ Neon) để xác minh không tái phát bất kỳ case bảo mật nào ở trên.

```powershell
# Backend lint, typecheck & security regression tests
Set-Location backend
uv run pytest --reuse-db `
  app/core/tests/test_csv_safety.py `
  app/core/tests/test_endpoint_access.py `
  app/core/tests/test_module_conventions.py `
  app/core/tests/test_openapi_schema.py `
  app/system/tests/test_attachment_content_api.py `
  app/system/tests/test_attachment_create_api.py `
  app/system/tests/test_attachment_visibility_api.py `
  app/system/tests/test_password_reset_request_api.py `
  app/system/tests/test_social_auth_url_api.py `
  app/system/tests/test_csrf_api.py `
  app/system/tests/test_refresh_api.py `
  app/system/tests/test_cleanup.py `
  app/system/tests/test_notification_dispatch_api.py `
  app/system/tests/test_user_role_assign_api.py `
  app/finance/tests/test_sepay_webhook_api.py `
  app/finance/tests/test_income_api.py `
  app/finance/tests/test_income_export_api.py `
  app/utilities/tests/test_donation_webhook_api.py `
  app/utilities/tests/test_donation_export_api.py `
  app/utilities/tests/test_donation_stats_api.py `
  app/utilities/tests/test_donation_list_api.py `
  app/core/tests/test_safe_http_client.py `
  app/utilities/tests/test_page_duplicate_api.py `
  app/utilities/tests/test_page_public_api.py `
  app/utilities/tests/test_donation_public_feed_api.py

# Frontend security checks (Open Redirect, Safe Links, Edge Proxy, Conventions)
Set-Location ../frontend
pnpm typecheck
pnpm test `
  tests/unit/security-controls.test.ts `
  tests/unit/auth-service.test.ts `
  tests/unit/one-unit-per-file.test.ts `
  tests/unit/code-conventions.test.ts `
  tests/unit/module-structure.test.ts
```

## 4. Giới hạn chưa kiểm (nếu có)

- `app/utilities/tests/test_page_public_api.py::TestPagePublicApi::test_public_published_page_success` đã được cập nhật assertion để kiểm tra trả về đúng `page.id` (UUID dùng cho feed Donate công khai) và không lộ `owner` hay `webhook_token`; 242/242 test BE trong 34 file trọng điểm và 618/618 test FE trong 27 file Vitest + `eslint --max-warnings 0` + `playwright-cli` đa vai trò (`FINANCE_VIEWER`, `portal.member`) đã PASS sau lần sửa code cuối (`NEXT_DIST_DIR=.next-verify pnpm build` đã đạt 181/181 route trước 3 chỉnh sửa hook/dashboard cuối).
- Chưa chạy toàn bộ suite Repo (`uv run pytest`, `pnpm test` không lọc file, `pnpm e2e` đầy đủ, `scripts/check-all.*`) hoặc kiểm thử runtime trên môi trường production (R2 signed URL, Upstash QStash thật).
