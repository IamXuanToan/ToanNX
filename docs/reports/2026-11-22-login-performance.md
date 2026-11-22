# Báo cáo: đăng nhập chậm (23 giây) và lỗi "timeout dù đã có thông báo đăng nhập"

Ngày: 2026-11-22 · Phạm vi: `POST /api/v1/system/auth/login` · Trạng thái: **phân tích, chưa sửa code**

## 1. Kết luận ngắn

1. **FE hủy request sau 15 giây, BE vẫn chạy tiếp đến hết.** `apiClient` có `apiTimeoutMs: 15_000`
   (`frontend/src/shares/config/env.ts`). Login production mất ~23 giây, nên trình duyệt báo lỗi `TIMEOUT`.
   Lúc đó BE đã commit phiên đăng nhập và đang gửi thông báo, nên **push Firebase "Có lượt đăng nhập mới"
   vẫn tới máy**. Response mang cookie thì không bao giờ tới trình duyệt, nên người dùng không vào được.
   Thấy push nhưng màn hình báo lỗi là vì vậy.
2. **Thời gian bị kéo dài chủ yếu vì gửi thông báo chạy đồng bộ ngay trong request login.** Không phải do
   kiểm tra mật khẩu hay token. Thông báo được gửi sau commit nhưng **trước khi trả response**: đi lần lượt
   qua FCM, SMTP và Telegram. "Ngân sách 5 giây" chỉ được kiểm **giữa các lần gửi**, và **mỗi lần
   `notify` lại có một ngân sách 5 giây riêng**. Một lần login có thể cộng dồn 2–3 ngân sách như vậy.
3. **Telegram là triệu chứng, không phải chỗ tốn thời gian chính.** Cảnh báo `Token bot Telegram ... không
   dùng được` xuất phát từ việc **giải mã token thất bại** (`SecretCipherError`). Bước này không gọi mạng nên
   rất nhanh. Khoảng 5 giây giữa hai cảnh báo là thời gian gửi **các kênh khác** (push/email) nằm giữa hai lần
   thử Telegram. Tuy vậy, lỗi Telegram sinh thêm một thông báo "gửi thất bại", và thông báo đó lại được gửi
   đồng bộ, nên vẫn làm request dài thêm.
4. **Vercel + Neon làm mỗi bước chậm hơn.** Login gọi khoảng 30 query (đo ở mục 3). Nếu function Vercel và
   Neon khác region thì riêng phần DB đã mất vài giây. Neon tự ngủ khi rảnh nên có thêm thời gian khởi động.
5. **"Initial connection ~15 giây" là chuyện riêng**: đó là giai đoạn TCP/TLS từ trình duyệt tới Vercel,
   trước khi Django nhận request. Chưa có bằng chứng nó cùng nguyên nhân.

> Chưa có log đo từng bước trên production. Các con số production ở mục 4 là **ước lượng** từ source và số
> đo local. Cần thêm phần đo thời gian ở mục 6 rồi đối chiếu bằng `X-Request-ID` mới khẳng định được tỉ lệ
> từng phần.

## 2. Luồng login thực tế (trace từ source)

| # | Bước | File | Gọi ra ngoài? |
| --- | --- | --- | --- |
| 1 | Middleware: `RequestContextMiddleware` tạo `request_id`, log tổng thời gian | `core/middleware/request_context_middleware.py` | Không |
| 2 | `LoginView.post` → `@validate_request(LoginValidateSerializer)`; quyền `AllowAny + CsrfProtected` | `system/views/login_view.py` | Không |
| 3 | Rate limit: `RateLimitService.hit` (upsert bucket trên DB) | `services/rate_limit_service.py` | DB |
| 4 | `authenticate()` → kiểm tra mật khẩu Argon2 (CPU, khoảng 50–150ms) | `services/auth_service.py` | DB |
| 5 | `rate_limit.reset`, mở `AuthSession`, phát refresh token (HMAC), `record_login` | `auth_service.py` | DB |
| 6 | `LoginNotificationService.notify_login` (**trong transaction**): tạo `system.auth.login` và, nếu là thiết bị mới, `system.auth.new_device` | `services/login_notification_service.py` | DB |
| 7 | **Commit → `transaction.on_commit` → `NotificationService.dispatch_ids`**, chạy ngay trong request | `services/notification_service.py` | **FCM, SMTP, Telegram** |
| 8 | `_build_result`: access token JWT + `get_profile_by_id` (user, vai trò, quyền) | `auth_service.py` | DB |
| 9 | `rotate_token` (CSRF), đặt cookie, trả response | `login_view.py` | Không |

Bước 7 chạy **trước** bước 8–9, nên response phải chờ gửi thông báo xong mới được trả.

### Kênh gửi trong một lần login

- `system.auth.login`: kênh mặc định chỉ `IN_APP`. Người dùng có thể bật thêm push/email/Telegram trong
  Hồ sơ → tab Thông báo (ảnh push bạn nhận được cho thấy push đang bật).
- `system.auth.new_device`: mặc định `IN_APP + PUSH + EMAIL`. Bật khi IP/trình duyệt chưa thấy trong 30 ngày.
  Trên Vercel, IP hay đổi nên sự kiện này **xảy ra thường xuyên**.
- Mỗi bản gửi Telegram lỗi hẳn (`FAILED`) → `_send_and_alert` tạo thêm sự kiện `system.delivery_failed`
  (gom theo giờ) cho người có quyền `notification_delivery.manage_all`, tức chính admin. Lời gọi `notify` này
  không nằm trong transaction, nên `on_commit` **chạy ngay**: **một lượt `dispatch_ids` lồng nhau với ngân sách
  5 giây mới**.

## 3. Số đo local (bằng chứng)

Chạy một lần login thật qua Django test client trên PostgreSQL local. Script chạy trong transaction rồi
rollback, nên `on_commit`, tức phần gửi thông báo, **không chạy** trong số đo này:

| Lần | HTTP | Số query | Thời gian |
| --- | --- | --- | --- |
| 1 (process mới) | 200 | 30 | 1.206 ms (gồm khởi động) |
| 2 | 200 | 29 | 198 ms |

Query theo bảng: `system_user` 4, `system_auth_session` 2–3, `system_user_social_account` 2,
`system_notification` 2, `rate_limit_bucket`, `refresh_token`, `notification_preference`, `role`,
`permission` mỗi bảng 1.

→ **Phần lõi (mật khẩu, phiên, token, hồ sơ) chỉ khoảng 200ms** khi DB ở gần. Không có N+1 đáng kể.

## 4. Vì sao production lên tới 23 giây (ước lượng, cần log xác nhận)

| Phần | Ước lượng | Lý do |
| --- | --- | --- |
| Cold start function Python và Neon thức dậy | 1–5 giây | `CONN_MAX_AGE=0` nên mở kết nối TLS mới mỗi request; Neon autosuspend |
| ~30 query × độ trễ Vercel ↔ Neon | 0,3–7 giây | Cùng region thì khoảng 5ms/query; khác châu lục (ví dụ `iad1` ↔ Singapore) khoảng 200ms+/query. `vercel.json` **chưa khai `regions`** |
| Gửi thông báo đồng bộ (bước 7) | **5–15+ giây** | Xem các mục ngay dưới |

Những điểm trong `dispatch_ids` làm request bị kéo dài:

- **Ngân sách chỉ kiểm trước mỗi bản.** Một bản đã bắt đầu thì chạy hết thời gian chờ của nó: SMTP tới
  `EMAIL_TIMEOUT=10s`, Telegram 5s, FCM 3s. Bản cuối có thể vượt 5 giây khá xa.
- **Mỗi `notify` một ngân sách riêng.** `login` và `new_device` là hai callback `on_commit`, mỗi callback 5 giây.
  Cộng thêm lượt lồng của `delivery_failed` thì một login có thể chịu **3 ngân sách**, tối đa 15 giây cộng phần
  vượt.
- **FCM làm mới access token không có timeout.** `credentials.refresh(GoogleAuthRequest())` dùng timeout mặc
  định của google-auth (120 giây). Lần đầu của mỗi instance serverless luôn phải refresh.
- **SMTP thật** (`new_device` có `EMAIL`) thường mất 1–3 giây mỗi thư.

Hai cảnh báo Telegram cách nhau ~5 giây khớp với chuỗi này. Lần 1: bản Telegram của `login` lỗi giải mã.
Sau đó tới push/email của lượt `delivery_failed` lồng nhau hoặc của `new_device`, mất khoảng 5 giây. Lần 2:
bản Telegram tiếp theo lỗi.

## 5. Telegram: vì sao token "không hợp lệ"

- `token_of()` → `SecretCipher.decrypt` → `SecretCipherError` → `mark_token_invalid()` ghi cảnh báo.
  **Không có lời gọi tới api.telegram.org**, nên Telegram không làm chậm trực tiếp.
- Khóa mã hóa dẫn xuất từ `DJANGO_SECRET_KEY`. Giải mã lỗi nghĩa là **`DJANGO_SECRET_KEY` production khác khóa
  lúc lưu token**. Ví dụ: đã đổi secret khi tách lại `.env`, hoặc DB chứa token lưu từ môi trường khác.
  **Token SePay mã hóa trước đó cũng sẽ hỏng theo**, cần kiểm tra luôn.
- `mark_token_invalid` chỉ ghi `last_error_code`, **bot vẫn `is_active`**, chat vẫn được chọn. Vì vậy
  **mọi thông báo sau đó** vẫn thử Telegram, vẫn lỗi, vẫn sinh `delivery_failed`. Mỗi lần login đều lặp lại.

## 6. Đề xuất (theo ưu tiên, không đổi nghiệp vụ và bảo mật)

**P0. Bỏ việc gửi thông báo ra khỏi request login** (sửa nguyên nhân thật, không tăng timeout)

1. Sự kiện xác thực (`auth.login`, `auth.new_device`, `auth.password_changed`) chỉ **ghi outbox trong
   transaction**, không gửi inline. Cron gửi thông báo (cron-job.org → `dispatch_pending`) gửi sau, trễ tối đa
   bằng chu kỳ cron (nên là 1 phút). Khai báo bằng thuộc tính trên `NotificationEventDefinition` (ví dụ
   `inline_dispatch=False`), không viết `if` riêng trong `AuthService`. Nghiệp vụ không đổi: thông báo vẫn được
   tạo trong cùng transaction với phiên và vẫn có retry.
2. Thông báo `delivery_failed` **không bao giờ gửi lồng inline**, để cron gửi.
3. Các luồng khác vẫn gửi inline thì dùng **một hạn chót chung cho cả request**, không phải mỗi `notify` một
   ngân sách. Timeout của từng nhà cung cấp lấy `min(timeout kênh, thời gian còn lại)`.

**P1. Sửa các nguồn treo và lặp lỗi**

4. FCM: làm mới token bằng `GoogleAuthRequest` có timeout 3 giây. Lỗi thì trả `PUSH_UNAVAILABLE` (lỗi tạm,
   cron thử lại).
5. Telegram: giải mã lỗi hoặc gặp 401/404 thì **tắt bot** (`is_active=False`). Bản gửi chuyển `SKIPPED`
   `TELEGRAM_BOT_MISSING`, chỉ cảnh báo một lần, Hồ sơ báo cần nhập lại token. Lần sau không thử lại vô ích.
6. Kiểm tra `DJANGO_SECRET_KEY` trên Vercel. Nếu đã đổi thì nhập lại token Telegram và SePay. Đừng đổi lại
   secret cũ nếu không chắc, vì sẽ làm mất hiệu lực mọi phiên đăng nhập hiện tại.

**P1. Đo thời gian từng bước** (để đối chiếu, không ghi dữ liệu nhạy cảm)

7. Thêm common nhỏ `StepTimer` trong `app/core/logging/` (cập nhật `docs/common-catalog.md`). Log một dòng
   `auth.login steps rate_limit=..ms authenticate=..ms session=..ms notify=..ms commit=..ms dispatch=..ms
   profile=..ms total=..ms`. `request_id` đã được gắn tự động bởi `request_context_filter`.
8. Trong dispatcher, log mỗi bản: `channel`, `status`, `error_code`, `elapsed_ms`, `delivery_id`. **Không** log
   email, chat id, token, FCM token, mật khẩu.
9. FE: khi login bị `TIMEOUT`, hiện thông báo riêng ("Máy chủ phản hồi chậm, thử lại"), có kèm `X-Request-ID`
   nếu đọc được. **Giữ nguyên 15 giây.**

**P2. Hạ tầng Vercel / Neon**

10. Khai `"regions": ["<region gần Neon>"]` trong `backend/vercel.json`, và cùng region cho project frontend.
    Ví dụ Neon `ap-southeast-1` ↔ Vercel `sin1`. Hiện chưa khai, nên Vercel dùng region mặc định.
11. Dùng host Neon **pooled** (`-pooler`) cho runtime, giữ `DB_CONN_MAX_AGE=0`. Xem lại autosuspend: gói Free
    ngủ sau 5 phút, request đầu sau đó chịu thêm thời gian khởi động.
12. Xem `maxDuration` và Fluid compute của function backend để biết giới hạn thời gian thực tế.
13. "Initial connection 15 giây": so sánh với các request khác cùng lúc, thử mạng khác hoặc tắt IPv6/VPN, xem
    log edge của Vercel. Đây là lớp mạng trước Django.

## 7. Kiểm thử sau khi sửa

| Test | Kiểm |
| --- | --- |
| `system/tests/test_login_api.py` | Login thành công **không gọi** `NotificationDispatcher.send`; outbox `PENDING` được tạo đúng kênh; cookie và hồ sơ giữ nguyên |
| `system/tests/test_notification_service.py` | Hạn chót chung: 3 lần `notify` trong một request không vượt ngân sách; `delivery_failed` không gửi inline |
| `system/tests/test_notification_dispatcher.py` | Giải mã token lỗi → bot `is_active=False`, bản gửi `SKIPPED`, lần sau không thử Telegram |
| `system/tests/test_fcm_client.py` | Refresh token timeout → `PUSH_UNAVAILABLE`, không treo |
| `core/tests/test_list_query_count.py` (đã có) | Số query không tăng |
| Thủ công trên production | Login < 2 giây; log `auth.login steps` khớp `X-Request-ID`; push tới sau khoảng 1 chu kỳ cron |

## 8. Hệ quả phụ hiện tại

- Mỗi lần login bị timeout vẫn **tạo một phiên trên DB**, dù trình duyệt không nhận được cookie. Phiên đó hiện
  trong "Phiên đăng nhập" và tự hết hạn. Người dùng thử lại thì thêm một phiên nữa và thêm một loạt thông
  báo/cảnh báo Telegram.
- Rate limit không khóa người dùng trong tình huống này: bộ đếm được reset ngay khi `authenticate` thành
  công, và mỗi lần thử lại đều xác thực đúng.
