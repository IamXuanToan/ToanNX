# Plan: đưa email và thông báo ra khỏi request (xử lý ngầm)

Ngày: 2026-11-22 · Liên quan: [2026-11-22-login-performance.md](2026-11-22-login-performance.md) · Trạng thái:
**đã thay bằng [plans/2026-11-22-free-tier-optimization.md](../plans/2026-11-22-free-tier-optimization.md)** (mục 1–2 vẫn đúng)

## 1. Mọi chỗ gửi email hiện tại

Chỉ có **một** lớp gửi thư là `EmailService` (`system/services/email_service.py`), với hai đường đi:

| Đường | Nơi gọi | Luồng nghiệp vụ | Chạy thế nào |
| --- | --- | --- | --- |
| `send_template` → `send_password_reset_email` | `PasswordResetService` (`password_reset_service.py:89`) | Quên mật khẩu | `EMAIL_ASYNC=True` (mặc định) → **thread pool trong process** |
| `send_template` → `send_email_verification` | `EmailVerificationService` (`email_verification_service.py:99`) ← `SendVerificationEmailView` | Xác minh email | Như trên |
| `send_template` → `send_user_invitation` | `UserInvitationService` (`user_invitation_service.py:104`) ← `UserService.create` (`user_service.py:182`) | Mời người dùng khi tạo user | Như trên |
| `send_now` | `NotificationDispatcher._email` (`notification_dispatcher.py:141`) | Kênh EMAIL của thông báo | **Đồng bộ**, ngay trong request (sau commit) hoặc trong cron |

Các sự kiện thông báo có EMAIL mặc định, nên sẽ gửi thư qua `send_now`:

| Sự kiện | Module | Được phát từ |
| --- | --- | --- |
| `system.auth.new_device` | system | Login (mật khẩu, Google/GitHub, kích hoạt lời mời) |
| `system.auth.password_changed` | system | Đổi hoặc đặt lại mật khẩu |
| `system.storage_quota_warning` | system | `AttachmentService` khi tải file lên |
| `finance` `WEBHOOK_AUTH_FAILED` | finance | `SepayWebhookService` (webhook SePay sai khóa) |

Người dùng bật thêm EMAIL trong Hồ sơ thì mọi sự kiện khác cũng gửi thư theo cùng đường `send_now`. Các nơi
phát thông báo là `income_service`, `sepay_webhook_service`, `attachment_service`, `login_notification_service`,
`system_announcement_service`, và lời gọi `notify` tạo cảnh báo gửi lỗi bên trong `notification_service`.

### Hai vấn đề của email trên Vercel

1. **`send_now` chạy đồng bộ trong request.** Mỗi thư SMTP mất khoảng 1–3 giây, tối đa `EMAIL_TIMEOUT=10s`.
   Đây là một phần lớn của 23 giây khi login.
2. **`EMAIL_ASYNC=True` dùng `ThreadPoolExecutor` không an toàn trên serverless.** Sau khi trả response, Vercel
   có thể đóng băng hoặc tắt instance, nên thread đang gửi thư bị dừng giữa chừng. Kết quả là **thư quên mật
   khẩu, xác minh, lời mời có thể mất mà không có log lỗi**. Bản thân code cũng đã ghi rõ cảnh báo này
   (`email_service.py:16`).

## 2. Firebase có làm hàng đợi kiểu Redis được không?

**Không nên.** Lý do:

| Thứ của Firebase | Có dùng làm hàng đợi được không |
| --- | --- |
| FCM (đang dùng) | Chỉ đẩy tin xuống trình duyệt hoặc điện thoại. Không có hàng đợi việc, không chạy code phía server |
| Firestore / Realtime Database | Chỉ là kho dữ liệu. Muốn "xử lý khi có bản ghi mới" thì phải có Cloud Functions |
| Cloud Functions (trigger Firestore) | **Bắt buộc gói Blaze (trả theo dùng, phải gắn thẻ).** Phải viết lại logic gửi mail/Telegram/push bằng runtime của Functions, tách khỏi Django: hai nơi giữ cùng nghiệp vụ, trái quy tắc "chỉ `NotificationService` được gửi" |
| Cloud Tasks (GCP, không phải Firebase) | Là hàng đợi thật, nhưng cần dự án GCP có billing và một endpoint nhận việc |

**Redis cũng không giải quyết được.** Redis chỉ là chỗ chứa hàng đợi. Vẫn cần một worker chạy liên tục (Celery,
RQ) để lấy việc ra xử lý, mà Vercel serverless thì không chạy tiến trình nền liên tục được.

**Dự án đã có hàng đợi rồi:** bảng outbox `system_notification_delivery` trên PostgreSQL. Trong đó đã có trạng
thái `PENDING`, `next_attempt_at`, số lần thử, lùi dần 1/5/15/60/240 phút, khóa `skip_locked` để không gửi trùng.
Hàng đợi này tương đương Redis queue. **Thứ còn thiếu là một "worker" chạy ngoài request**, chứ không cần thêm
kho chứa.

## 3. Phương án

| Phương án | Độ trễ thông báo | Chi phí / phụ thuộc mới | Đánh giá |
| --- | --- | --- | --- |
| **A. Outbox + cron-job.org mỗi 1 phút** | ≤ 1 phút | Không có (endpoint `POST /notifications/dispatch` đã có) | **Khuyên dùng trước tiên** |
| B. A + QStash (Upstash) đẩy việc ngay sau commit | Vài giây | Dịch vụ ngoài miễn phí có hạn mức, thêm 3 biến env, cần duyệt | Làm sau nếu thấy chậm 1 phút là không chấp nhận được |
| C. Firebase Cloud Functions | Vài giây | Gói Blaze, viết lại logic ở nơi khác | Không khuyên |
| D. Redis + Celery/RQ | Vài giây | Cần server chạy liên tục (không phải Vercel) | Không hợp kiến trúc hiện tại |

Một lựa chọn cần xác minh thêm: Vercel có cơ chế `waitUntil` để chạy tiếp sau khi trả response, nhưng chưa
chắc runtime Python (`@vercel/python`, WSGI) hỗ trợ. Không dựa vào nó khi chưa thử trên Vercel thật.

## 4. Plan triển khai (phương án A)

### Bước 1. Request không bao giờ gọi nhà cung cấp

- `NotificationService.notify` chỉ ghi `Notification` và `NotificationDelivery(PENDING)` trong transaction,
  **bỏ `on_commit → dispatch_ids`**. Thông báo trong chuông (IN_APP) vẫn hiện ngay, vì nó là bản ghi DB, không
  cần gửi.
- `_send_and_alert` khi tạo cảnh báo `delivery_failed` cũng chỉ ghi outbox. Bỏ lượt gửi lồng nhau.
- Giữ `NOTIFICATION_DISPATCH_BUDGET_SECONDS` cho cron. Biến dành cho request thì bỏ, hoặc đặt mặc định 0.
  Đổi env thì cập nhật `.env.example` và `deployment.md`.
- Nghiệp vụ không đổi: cùng sự kiện, cùng người nhận, cùng kênh, cùng retry. Chỉ đổi **thời điểm gửi**.

### Bước 2. Worker = cron-job.org

- Job gọi `POST https://api.toannx.com/api/v1/system/notifications/dispatch` **mỗi 1 phút**, kèm header
  `Authorization: Bearer <CRON_SECRET>`. Hướng dẫn hiện ghi "1–5 phút", sẽ đổi thành 1 phút.
- Mỗi lượt cron gửi tối đa 200 bản trong 50 giây. Cần kiểm tra con số này nằm dưới `maxDuration` của function.
- Cron trả về số bản đã gửi, còn lại bao nhiêu và thời gian chạy, để theo dõi trên cron-job.org.

### Bước 3. Email theo template (quên mật khẩu, xác minh, lời mời)

- Production đặt `EMAIL_ASYNC=False`: gửi đồng bộ, có kết quả thật, không mất thư âm thầm. Đây là các thao tác
  người dùng tự bấm và chờ, nên 1–3 giây là chấp nhận được. Login thì không đi đường này.
- Giảm `EMAIL_TIMEOUT` production xuống khoảng 5 giây để giới hạn trường hợp xấu nhất. Đây là chặn treo, không
  phải tăng timeout để che lỗi.
- **Không** đưa các thư này vào outbox: thư có link chứa token đặt lại mật khẩu, lời mời, xác minh. Ghi link đó
  vào DB dạng thô là trái quy tắc bảo mật.
- Tùy chọn sau này: dùng API HTTP của nhà cung cấp email thay SMTP để mỗi thư còn khoảng 200–500ms. Cần duyệt
  vì là phụ thuộc mới.

### Bước 4. Sửa các lỗi phụ đã thấy

- FCM: làm mới token với timeout 3 giây.
- Telegram: giải mã token lỗi hoặc gặp 401/404 thì tắt bot, các bản gửi chuyển `SKIPPED`, chỉ cảnh báo một lần.
- Kiểm tra `DJANGO_SECRET_KEY` production, nhập lại token Telegram và SePay nếu cần.

### Bước 5. Đo thời gian và tài liệu

- Thêm common `StepTimer` (`app/core/logging/`, cập nhật `docs/common-catalog.md`), log các bước của login kèm
  `request_id`.
- Dispatcher log `channel`, `status`, `error_code`, `elapsed_ms`. Không log email, chat id, token.
- Cập nhật `docs/features/web-push.md` (push tới sau tối đa 1 phút), `docs/guides/notification-setup.md`,
  `docs/modules/system/README.md`, `docs/rules/backend.md` (quy tắc "request không gọi dịch vụ ngoài để gửi
  thông báo"), và cả `CLAUDE.md` / `AGENTS.md` nếu thêm quy tắc cốt lõi.

### Bước 6 (tùy chọn). QStash để thông báo gần tức thì

- Sau commit, gửi **một** HTTP request tới QStash (khoảng 50–150ms, timeout 1 giây, lỗi thì bỏ qua và cron gửi
  bù). QStash gọi lại endpoint dispatch ở một lượt function riêng, nên request login không phải chờ.
- Cần: biến env `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`. Endpoint nhận gọi lại
  phải kiểm chữ ký và khai trong `ModuleDescriptor.callbacks`. Cron vẫn giữ làm lưới an toàn.
- Chỉ làm khi bạn duyệt dùng dịch vụ ngoài.

## 5. Kiểm thử (chỉ các file liên quan)

| File | Kiểm |
| --- | --- |
| `system/tests/test_login_api.py` | Login không gọi `NotificationDispatcher.send`; có outbox `PENDING` đúng kênh |
| `system/tests/test_notification_service.py` | `notify` không gửi inline; `delivery_failed` chỉ ghi outbox |
| `system/tests/test_notification_dispatch_api.py` | Cron gửi các bản PENDING, vẫn đúng retry và lùi dần |
| `system/tests/test_password_reset_api.py`, `test_send_verification_email_api.py` | `EMAIL_ASYNC=False` gửi đồng bộ, lỗi SMTP trả đúng kết quả |
| `system/tests/test_fcm_client.py`, `test_notification_dispatcher.py` | Timeout FCM; bot Telegram hỏng token bị tắt |

## 6. Kết quả mong đợi

- Login: chỉ còn phần lõi, cỡ 200ms trên DB local; trên production phụ thuộc region và Neon, mục tiêu dưới
  2 giây. Không còn lỗi timeout 15 giây.
- Push, email, Telegram của sự kiện tới sau tối đa 1 phút (hoặc vài giây nếu dùng QStash).
- Thư quên mật khẩu, xác minh, lời mời không còn mất âm thầm trên Vercel.
