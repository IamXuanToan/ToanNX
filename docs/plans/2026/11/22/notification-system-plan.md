# Plan hệ thống thông báo (system)

Trạng thái: **đã duyệt** (D1 = A: Firebase + polling; D2: outbox + cron-job.org miễn phí mỗi 1–5 phút; D3: duyệt `google-auth`, `firebase`). Plan này làm cùng đợt với `finance-refactor-plan.md` (là
phase 0b của plan đó) và thay mục 15 cũ của plan finance (Telegram theo người dùng đã gộp vào đây).

Mục lục:

1. Mục tiêu
2. Hạ tầng và quyết định cần chốt
3. Khái niệm
4. Mô hình dữ liệu
5. Common: khai báo sự kiện và gửi thông báo
6. Kênh gửi
7. Chạy bất đồng bộ
8. Realtime và popup (Firebase)
9. Danh mục sự kiện ban đầu
10. Quyền và hiển thị
11. API
12. Frontend
13. Cấu hình Firebase và biến môi trường
14. Các phase
15. Kịch bản test
16. Ngoài phạm vi

---

## 1. Mục tiêu

- **Chuông thông báo** trong app. Mở ra có 2 tab:
  - **Cá nhân**: việc của chính mình. Ví dụ: tiền vào qua webhook SePay, giao dịch cần xử lý, có lượt đăng nhập,
    đăng nhập từ thiết bị mới.
  - **Hệ thống**: thông báo chung, như thông báo quản trị viên gửi và cảnh báo vận hành (cho người có quyền).
- Mỗi thông báo có mức **info / warning / error** (màu và biểu tượng theo token).
- **Realtime**: thông báo mới hiện ngay, gồm popup trong trang và thông báo của trình duyệt/hệ điều hành kiểu
  Facebook, kể cả khi đã đóng tab.
- Kênh ngoài: Email, Telegram (bot riêng mỗi người).
- **Một common duy nhất** để module phát thông báo, đúng người nhận và đúng quyền.
- Gửi **không ảnh hưởng nghiệp vụ**: lỗi gửi không làm hỏng request, gửi chậm không làm chậm webhook.

---

## 2. Hạ tầng và quyết định cần chốt

Hiện trạng (`docs/guides/deployment.md`, `SYSTEM_CONTEXT.md`):

- Backend là Django **WSGI** chạy trên **Vercel serverless** (`@vercel/python`), DB Neon.
- Không giữ state, không có worker chạy nền.
- Cron Vercel chạy **1 lần/ngày** (03:00 UTC) gọi `/system/health/cleanup`.

### D1. WebSocket: không làm được trên hạ tầng hiện tại

Serverless chỉ sống trong thời gian một request, nên không giữ được kết nối WebSocket lâu dài. Django Channels cần
máy chạy liên tục (ASGI) và Redis.

Các hướng:

| Hướng | Realtime | Popup kiểu Facebook | Chi phí / thay đổi |
|---|---|---|---|
| **A. Firebase Cloud Messaging + polling dự phòng** (đề xuất) | có: FCM đẩy thẳng tới trình duyệt | có (service worker) | miễn phí; backend chỉ gọi HTTP tới FCM |
| B. Dịch vụ realtime (Pusher/Ably) | có | không (vẫn cần push riêng) | thêm dịch vụ trả phí khi lớn |
| C. Chuyển backend sang VPS + Django Channels + Redis | có | không (vẫn cần push riêng) | đổi kiến trúc triển khai |

Đề xuất **A**:

- FCM vừa là đường realtime (tin `data` vào tab đang mở), vừa hiện popup hệ điều hành (tab đóng vẫn nhận).
- Trình duyệt không cấp quyền thông báo thì dùng polling số chưa đọc mỗi 60 giây khi tab đang mở, cộng thêm khi
  quay lại tab.
- Code đặt sau interface `RealtimeTransport`, nên sau này chuyển sang VPS có thể thêm WebSocket mà không sửa nơi
  phát thông báo.

### D2. Bất đồng bộ trên serverless

Không có worker, nên dùng mẫu **outbox**:

1. Trong transaction nghiệp vụ, chỉ **ghi DB**: tạo dòng thông báo và các dòng chờ gửi. Việc này nhanh, chạy trong
   savepoint riêng, lỗi thì chỉ ghi log và không làm hỏng nghiệp vụ.
2. Sau khi commit (`transaction.on_commit`), gửi ngay các dòng chờ với **ngân sách thời gian**: tối đa 5 giây cho
   cả request, mỗi lần gọi ngoài timeout 3 giây. Hết giờ thì dừng, dòng còn lại giữ `PENDING`.
3. Một **cron dispatch** gửi nốt và retry.

Cron Vercel 1 lần/ngày thì lần gửi lỗi phải chờ tới hôm sau. Để gửi nhanh hơn, cần chọn một trong hai:

- **(đề xuất)** dùng dịch vụ cron ngoài miễn phí (ví dụ cron-job.org) gọi `POST /system/notifications/dispatch` mỗi
  1–5 phút với `Authorization: Bearer <CRON_SECRET>`;
- hoặc nâng Vercel Pro (cron theo phút).

### D3. Dependency mới (cần duyệt)

| Gói | Ở đâu | Dùng để |
|---|---|---|
| `google-auth` | backend | lấy access token OAuth2 từ service account để gọi FCM HTTP v1 (gọi HTTP bằng `requests` đã có) |
| `firebase` (npm) | frontend | chỉ dùng `firebase/app` + `firebase/messaging` để lấy token FCM và nhận tin khi tab mở |

Service worker tự viết, không `importScripts` từ CDN. Nó nghe sự kiện `push` rồi `showNotification`, nên không phải
nới CSP cho `gstatic.com`.

---

## 3. Khái niệm

| Khái niệm | Nghĩa |
|---|---|
| Sự kiện (event) | một loại việc module có thể báo, khai trong `ModuleDescriptor.notification_events` |
| Thông báo (notification) | một dòng trong chuông của **một** người nhận |
| Phạm vi (`scope`) | `PERSONAL` → tab Cá nhân; `SYSTEM` → tab Hệ thống |
| Người nhận (`audience`) | `OWNER`: chỉ người được chỉ định lúc phát (chủ dữ liệu); `SUBSCRIBERS`: mọi người có quyền của sự kiện và không tắt nó |
| Mức (`level`) | `INFO` / `WARNING` / `ERROR` |
| Kênh (`channel`) | `IN_APP` (chuông), `PUSH` (popup trình duyệt), `EMAIL`, `TELEGRAM` |
| Tùy chọn (preference) | người dùng bật/tắt từng sự kiện × kênh |
| Lần gửi (delivery) | outbox: một lần gửi một thông báo qua một kênh tới một đích |

Thông báo hệ thống gửi cho nhiều người được **tách thành từng dòng cho từng người**. Như vậy trạng thái đã đọc là của
riêng mỗi người, truy vấn chuông đơn giản. Số người dùng của site nhỏ nên không có vấn đề kích thước.

---

## 4. Mô hình dữ liệu (module system)

### 4.1 `Notification` (`system_notification`)

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `recipient` | FK user | người nhận |
| `scope` | `PERSONAL` / `SYSTEM` | tab hiển thị |
| `level` | `INFO` / `WARNING` / `ERROR` | |
| `event_code` | char(100) | ví dụ `finance.income.received` |
| `module` | char(50) | module phát (lọc, biểu tượng) |
| `title` | char(200) | tiêu đề đã dựng sẵn (tiếng Việt), dùng cho push/email/Telegram và làm dự phòng |
| `body` | text | nội dung ngắn |
| `message_key`, `params` | char, JSON | khóa i18n + tham số; FE ưu tiên dịch theo ngôn ngữ đang chọn, không có khóa thì dùng `title`/`body` |
| `link` | char(500) | đường dẫn FE nội bộ (bắt đầu bằng `/`), mở khi bấm |
| `data` | JSON | dữ liệu phụ (id bản ghi...) |
| `dedup_key` | char(200) | unique `(recipient, event_code, dedup_key)`: phát lại không tạo trùng |
| `read_at` | datetime null | |
| `expires_at` | datetime null | quá hạn thì ẩn (thông báo hệ thống tạm thời) |

Index:

- `(recipient, scope, read_at, created_at desc)`: chuông và số chưa đọc;
- `(recipient, created_at desc)`.

Không dùng `JournalTracker` (dữ liệu tạm, không cần lịch sử sửa).

### 4.2 `NotificationDelivery` (outbox, sửa model hiện có)

| Field | Ý nghĩa |
|---|---|
| `notification` | FK |
| `channel` | `PUSH` / `EMAIL` / `TELEGRAM` (`IN_APP` không cần delivery) |
| `target` | đích: id `PushDevice`, id `TelegramChat`, hoặc email |
| `status` | `PENDING` / `SENT` / `FAILED` / `SKIPPED` |
| `attempts`, `next_attempt_at`, `last_error_code`, `sent_at`, `provider_message_id` | giữ như hiện tại |

Unique `(notification, channel, target)`. Bỏ FK `route` cũ.

### 4.3 `NotificationPreference` (thay `NotificationRoute`)

| Field | Ý nghĩa |
|---|---|
| `user` | |
| `event_code` | |
| `channel` | `IN_APP` / `PUSH` / `EMAIL` / `TELEGRAM` |
| `telegram_chat` | FK null, bắt buộc khi `TELEGRAM`, phải thuộc `user` |
| `is_enabled` | |

- Unique `(user, event_code, channel, telegram_chat)`.
- **Không có dòng thì dùng mặc định của sự kiện** (`default_channels`, mục 5.1). Chỉ lưu khi người dùng đổi.
- Sự kiện `ERROR` có `IN_APP` bắt buộc (không tắt được), để lỗi quan trọng luôn hiện trong chuông.

### 4.4 `PushDevice` (`system_push_device`)

| Field | Ý nghĩa |
|---|---|
| `user` | |
| `fcm_token` | char(500) unique |
| `user_agent`, `label` | ví dụ "Chrome · Windows" |
| `is_active` | FCM báo `UNREGISTERED` / `INVALID_ARGUMENT` thì tắt |
| `last_seen_at` | cập nhật mỗi lần FE đăng ký lại |

Token là định danh thiết bị do Firebase cấp, không phải bí mật, nên lưu thường.

### 4.5 `TelegramBot`, `TelegramChat` (theo người dùng)

- `TelegramBot`: mỗi người một bot (`owner` unique), `token_encrypted` (mã hóa bằng `SecretCipher`, mục 5.4),
  `bot_id`, `username`, `is_active`, `last_checked_at`, `last_error_code`.
- `TelegramChat`: thêm `owner`, `bot` (FK); unique `(bot, chat_id)`; giữ luồng đăng ký bằng mã hiện tại; hỗ trợ
  nhóm (`?startgroup=`) và chat riêng (`?start=`).
- Bỏ biến env `TELEGRAM_BOT_TOKEN`.

### 4.6 `SystemAnnouncement` (thông báo quản trị viên gửi)

| Field | Ý nghĩa |
|---|---|
| `title`, `body`, `level`, `link` | |
| `target` | `ALL` (mọi user active) / `ROLES` |
| `roles` | M2M Role (khi `ROLES`) |
| `expires_at` | null = không hết hạn |
| `sent_at`, `recipient_count` | |

Gửi = phát sự kiện `system.announcement` (`scope SYSTEM`) tới từng người thuộc đối tượng.

### 4.7 Migration

- Migration system `0009` thông báo hiện **chưa commit**: rollback (`migrate system 0008`), xóa file, sinh lại theo
  mục 4.
- Dữ liệu route cũ chỉ có ở local nên không cần chuyển.

---

## 5. Common: khai báo sự kiện và gửi thông báo

### 5.1 `NotificationEventDefinition` (core, mở rộng)

```python
NotificationEventDefinition(
    code="finance.income.received",          # <module>.<resource>.<event>
    name="Có tiền vào",
    description="Webhook SePay hoặc lấy thủ công ghi nhận một khoản thu nhập.",
    scope="PERSONAL",                         # PERSONAL | SYSTEM
    audience="OWNER",                         # OWNER | SUBSCRIBERS
    permission="finance.income.read",         # cần quyền này để thấy, đăng ký và nhận
    default_level="INFO",                     # INFO | WARNING | ERROR
    default_channels=("IN_APP", "PUSH"),      # bật sẵn khi người dùng chưa chỉnh
    kind="business",                          # business | technical (giữ)
)
```

Validate khi đăng ký module:

- `permission` phải tồn tại trong danh mục quyền;
- `scope SYSTEM` thì `audience` phải là `SUBSCRIBERS`;
- `default_level = ERROR` thì phải có `IN_APP` trong `default_channels`;
- mã sự kiện không trùng.

### 5.2 `NotificationService.notify` (điểm vào duy nhất)

```python
self.notification_service.notify(
    event_code="finance.income.received",
    recipient=income.owner,        # bắt buộc với audience OWNER; bỏ trống với SUBSCRIBERS
    dedup_key=f"income:{income.pk}",
    title="Tiền vào 9.200.000 ₫ · Facebook",
    body="META PLATFORMS IRELAND THANH TOAN QC",
    level=None,                    # None = default_level; truyền để nâng mức (ví dụ WARNING)
    link=FINANCE_PATHS.income_detail(income.pk),
    message_key="finance.notifications.incomeReceived",
    params={"amount": "9200000", "platform": "Facebook"},
    data={"income_id": str(income.pk)},
)
```

Các bước bên trong, tất cả nằm trong `transaction.atomic(savepoint=True)`; mọi exception được bắt và ghi log
`notification.notify_failed`, **không ném ra nơi gọi**:

1. Lấy định nghĩa sự kiện. Không có, hoặc `OWNER` thiếu `recipient`, thì ném `ImproperlyConfigured` (lỗi lập trình,
   test bắt được, không bị nuốt).
2. Tập người nhận:
   - `OWNER`: `[recipient]`;
   - `SUBSCRIBERS`: user active có `permission` (qua IAM service; superuser luôn có).
3. Lọc người nhận: active và có `permission`.
4. Với mỗi người, tính kênh bật (`NotificationPreference`, không có dòng thì dùng `default_channels`):
   - `IN_APP` bật → tạo `Notification` (bỏ qua nếu trùng `dedup_key`);
   - `PUSH` → một delivery cho mỗi `PushDevice` active của người đó (kèm `IN_APP`, vì popup cần bản ghi để mở);
   - `EMAIL` → delivery tới email người đó;
   - `TELEGRAM` → delivery tới từng chat đã chọn trong preference (chat phải `VERIFIED`, bot active).
5. Đăng ký `on_commit(dispatcher.dispatch_ids(ids, budget=5s))`.
6. Trả số thông báo đã tạo.

Có thêm `notify_many(...)` cho thông báo hệ thống gửi nhiều người, dùng `bulk_create` theo lô 500.

Quy tắc cho module: **chỉ gọi `notify`** qua service (đúng rule lớp). Không tự gửi Telegram/email/push, không đọc
model thông báo.

### 5.3 `NotificationDispatcher`

- `dispatch_ids(ids, budget)`: gửi các delivery `PENDING` theo thứ tự, dừng khi hết ngân sách.
- `dispatch_pending(limit=200, budget=50s)`: cho cron.
- Kết quả:
  - thành công → `SENT`;
  - lỗi tạm (timeout, 5xx, 429) → `attempts += 1`, `next_attempt_at` lùi dần 1, 5, 15, 60, 240 phút; quá 5 lần thì
    `FAILED`;
  - lỗi vĩnh viễn (token push hết hạn, chat bị xóa, email sai) → `FAILED` ngay, kèm xử lý theo kênh (mục 6).
- Trước khi gửi kiểm lại: người nhận còn active và còn quyền, không thì `SKIPPED` (`NOTIFICATION_PERMISSION_REVOKED`).
- Khóa dòng bằng `select_for_update(skip_locked=True)` để cron và request không gửi trùng.

### 5.4 `SecretCipher` (core, dùng chung với SePay)

`app/core/security/secret_cipher.py`:

- `encrypt(purpose, text)` / `decrypt(purpose, token)` bằng Fernet.
- Khóa mỗi mục đích dẫn xuất từ `DJANGO_SECRET_KEY` qua `salted_hmac`.
- Lỗi giải mã thì ném `SecretCipherError`.

---

## 6. Kênh gửi

| Kênh | Client | Gửi | Lỗi vĩnh viễn |
|---|---|---|---|
| `IN_APP` | — | không cần gửi; FE thấy qua realtime (mục 8) hoặc polling | — |
| `PUSH` | `FcmClient` (`google-auth` lấy access token, cache tới gần hết hạn; `requests` POST `https://fcm.googleapis.com/v1/projects/{id}/messages:send`) | tin có `notification` (title, body, icon) + `webpush.fcm_options.link` + `data` (`notification_id`, `scope`, `level`, `link`) | `UNREGISTERED`, `INVALID_ARGUMENT` → tắt `PushDevice` |
| `EMAIL` | `EmailService.send_template` có sẵn | template `notification` (title, body, nút mở link, mức) | địa chỉ bị từ chối → `FAILED` |
| `TELEGRAM` | `TelegramClient` có sẵn, dùng token bot của người nhận | `title` + `body` + link | chat bị kick/xóa → `FAILED`, chat chuyển `ERROR`; bot token sai → bot `last_error_code` |

Firebase chưa cấu hình (thiếu biến env) thì kênh `PUSH` bị ẩn khỏi màn tùy chọn và không tạo delivery `PUSH`.

---

## 7. Chạy bất đồng bộ

```
request nghiệp vụ (webhook SePay, đăng nhập...)
  ├─ transaction nghiệp vụ
  │    └─ notify() ── savepoint ── ghi Notification + NotificationDelivery(PENDING)
  ├─ commit
  ├─ on_commit: dispatcher.dispatch_ids(budget 5s, mỗi lần gọi ngoài timeout 3s)
  └─ trả response (webhook vẫn trong 30 giây SePay cho phép)

cron (cron-job.org mỗi 1–5 phút, và Vercel Cron hằng ngày)
  └─ POST /system/notifications/dispatch  (Bearer CRON_SECRET)
       └─ dispatch_pending(limit 200, budget 50s)
```

Bảo đảm:

- `notify` lỗi → nghiệp vụ vẫn commit (savepoint + bắt lỗi). Có test bắt buộc.
- Gửi lỗi hoặc chậm → response vẫn trả trong ngân sách, phần còn lại cron gửi.
- Không gửi trùng: unique ở `Notification` và `NotificationDelivery`, cộng `skip_locked` khi gửi.
- Dọn dẹp (thêm vào `cleanup_tasks`):
  - xóa `Notification` đã đọc quá 90 ngày, mọi `Notification` quá 180 ngày;
  - xóa delivery quá 30 ngày;
  - xóa `PushDevice` không thấy quá 60 ngày.

---

## 8. Realtime và popup (Firebase)

### 8.1 Đăng ký thiết bị

1. Người dùng bấm **"Bật thông báo trên trình duyệt"** ở chuông hoặc ở Hồ sơ → Thông báo. Hệ thống không tự hỏi quyền
   khi tải trang.
2. FE gọi `Notification.requestPermission()`, đăng ký service worker `/notification-sw.js`, rồi
   `getToken(messaging, { vapidKey, serviceWorkerRegistration })`.
3. `POST /system/notifications/devices {fcm_token, label}` (upsert theo token, gắn user hiện tại).
4. Mỗi lần mở app khi đã cấp quyền: lấy lại token, gửi lại nếu đổi (cập nhật `last_seen_at`).
5. Đăng xuất: `DELETE /system/notifications/devices/<token>` và `deleteToken()`. Thiết bị dùng chung không nhận
   thông báo của người đã đăng xuất.

### 8.2 Nhận tin

- **Tab đang mở** (foreground): `onMessage` của `firebase/messaging` →
  - invalidate query chuông và số chưa đọc;
  - hiện toast theo mức (`sonner`: info/warning/error), có nút "Xem";
  - không gọi `showNotification` để tránh hiện hai lần.
  - **Đã làm khác**: không dùng `onMessage`; service worker nhận `push`, nếu có tab đang hiện thì `postMessage`
    (BroadcastChannel `notifications`) cho tab đó, không thì `showNotification`. Một đường nhận duy nhất cho cả
    hai trạng thái, không phải giữ SDK messaging ở tab.
- **Tab đóng hoặc nền** (background): service worker `public/notification-sw.js` nghe `push`, đọc payload, gọi
  `self.registration.showNotification(title, {body, icon, badge, tag: notification_id, data: {link}})`.
  - `notificationclick` → focus tab đang mở cùng origin, hoặc `clients.openWindow(link)`.
  - Mở xong, FE gọi đánh dấu đã đọc.
- **Không cấp quyền hoặc trình duyệt không hỗ trợ**: polling `GET /system/notifications/unread-count` mỗi 60 giây khi
  `document.visibilityState === "visible"`, cộng khi tab được focus.
- **Nhiều tab**: `BroadcastChannel("notifications")` báo đã đọc để các tab đồng bộ số chưa đọc.

### 8.3 Cấu hình Firebase phía FE

- Config Firebase web (apiKey, projectId, messagingSenderId, appId) là công khai. Đọc qua `shares/config/env.ts` từ
  `NEXT_PUBLIC_FIREBASE_*`.
- Service worker là file tĩnh, không cần config, vì chỉ xử lý sự kiện `push` chuẩn.
- CSP `connect-src` thêm `https://fcmregistrations.googleapis.com`, `https://firebaseinstallations.googleapis.com`.
  Kiểm lại khi làm phase N6.

---

## 9. Danh mục sự kiện ban đầu

| Mã | Module | Scope | Audience | Quyền | Mức | Kênh mặc định | Phát khi |
|---|---|---|---|---|---|---|---|
| `finance.income.received` | finance | PERSONAL | OWNER | `finance.income.read` | INFO | IN_APP, PUSH | webhook/import tạo thu nhập |
| `finance.income.needs_review` | finance | PERSONAL | OWNER | `finance.income.read` | WARNING | IN_APP, PUSH | không nhận diện được, không rõ số tiền, nền tảng chưa có mốc thuế |
| `finance.sepay.webhook_auth_failed` | finance | PERSONAL | OWNER | `finance.sepay.manage` | ERROR | IN_APP, PUSH, EMAIL | webhook sai chữ ký (gom theo giờ bằng `dedup_key = giờ`) |
| `system.auth.login` | system | PERSONAL | OWNER | không cần quyền (luôn nhận) | INFO | IN_APP | đăng nhập thành công (mật khẩu hoặc OAuth) |
| `system.auth.new_device` | system | PERSONAL | OWNER | không cần quyền | WARNING | IN_APP, PUSH, EMAIL | đăng nhập từ trình duyệt/hệ điều hành + IP chưa thấy trong 30 ngày |
| `system.auth.password_changed` | system | PERSONAL | OWNER | không cần quyền | WARNING | IN_APP, EMAIL | đổi/đặt lại mật khẩu |
| `system.announcement` | system | SYSTEM | SUBSCRIBERS | không cần quyền (đối tượng do người gửi chọn) | theo bài | IN_APP, PUSH | quản trị viên gửi thông báo |
| `system.notification.delivery_failed` | system | SYSTEM | SUBSCRIBERS | `system.notification_delivery.manage_all` | ERROR | IN_APP | một delivery chuyển `FAILED` (gom theo giờ) |
| `system.storage.quota_warning` | system | SYSTEM | SUBSCRIBERS | `system.attachment.manage_all` | WARNING | IN_APP, EMAIL | dung lượng R2 vượt ngưỡng (dùng `r2_usage_service` có sẵn) |

Ghi chú:

- "Không cần quyền" khai `permission=None`. Khi đó chỉ áp cho `OWNER`, hoặc cho `system.announcement` mà đối tượng
  đã chọn rõ.
- Đăng nhập: `AuthService`/`OAuthService` gọi `notify` sau khi tạo phiên. Lỗi gửi không ảnh hưởng đăng nhập.
- Nhận diện "thiết bị mới": dựa trên phiên đăng nhập 30 ngày gần nhất (`user_agent` đã chuẩn hóa + IP) qua
  `SessionService`. Không thêm bảng.

---

## 10. Quyền và hiển thị

Quyền system (thêm/sửa):

| Quyền | Dùng cho |
|---|---|
| `system.notification.read` | xem chuông của mình (gán trong role MEMBER mọi module system; mặc định mọi user đăng nhập đều có qua role) |
| `system.notification_preference.{read,update}` | tab Thông báo trong Hồ sơ |
| `system.push_device.{read,create,delete}` | bật/tắt thông báo trình duyệt |
| `system.telegram_bot.{read,create,update,delete,manage_all}` | bot riêng |
| `system.telegram_chat.{read,create,update,delete,manage_all}` | chat nhận |
| `system.notification_delivery.{read,update,manage_all}` | nhật ký gửi, gửi lại |
| `system.announcement.{read,create,delete}` | gửi thông báo hệ thống |

Bỏ `system.notification_route.*` (thay bằng preference).

Hiển thị:

| Thành phần | Hiện khi |
|---|---|
| Chuông | đã đăng nhập và có `system.notification.read` |
| Tab "Hệ thống" trong chuông | luôn có khi có chuông (rỗng thì hiện trạng thái trống) |
| Nút "Bật thông báo trình duyệt" | Firebase đã cấu hình, trình duyệt hỗ trợ, có `system.push_device.create`, chưa cấp quyền |
| Hồ sơ → tab "Thông báo" | `system.notification_preference.read` |
| Khối Bot Telegram | `system.telegram_bot.read` |
| Khối Nơi nhận Telegram | `system.telegram_chat.read` **và** đã có bot |
| Cột Telegram trong bảng tùy chọn | `system.telegram_chat.read` và có ít nhất một chat `VERIFIED` |
| Cột Trình duyệt (PUSH) | Firebase đã cấu hình |
| Dòng sự kiện trong bảng tùy chọn | người dùng có `permission` của sự kiện (hoặc sự kiện không cần quyền) |
| Hệ thống → Nhật ký thông báo | `system.notification_delivery.read` |
| Hệ thống → Gửi thông báo | `system.announcement.read` |

`member_permissions` của system thêm:

- `system.notification.read`
- `system.notification_preference.{read,update}`
- `system.push_device.{read,create,delete}`
- `system.telegram_bot.{read,create,update,delete}`
- `system.telegram_chat.{read,create,update,delete}`
- `system.notification_delivery.read`

---

## 11. API

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/system/notifications?scope=&unread=&page=` | chuông, của chính mình, 20/trang, mới nhất trước; ẩn quá hạn |
| GET | `/system/notifications/unread-count` | `{personal, system}`; truy vấn theo index |
| POST | `/system/notifications/<id>/read` | |
| POST | `/system/notifications/read-all?scope=` | |
| DELETE | `/system/notifications/<id>` | ẩn khỏi chuông (xóa cứng, của mình) |
| GET | `/system/notifications/events` | sự kiện người gọi được nhận + kênh khả dụng |
| GET/PUT | `/system/notifications/preferences` | ma trận sự kiện × kênh; PUT đồng bộ, chặn tắt `IN_APP` của sự kiện ERROR |
| POST | `/system/notifications/devices` | upsert token FCM |
| DELETE | `/system/notifications/devices/<token>` | |
| GET/PUT/DELETE | `/system/telegram/bot` | bot của mình (token chỉ ghi) |
| POST | `/system/telegram/bot/check` | `getMe` + `getWebhookInfo` |
| CRUD | `/system/telegram/chats` | đăng ký, xác minh, gửi thử |
| GET | `/system/notifications/deliveries` | nhật ký (của mình / mọi người với `manage_all`); `POST …/<id>/retry` |
| CRUD | `/system/announcements` | tạo = gửi ngay; xóa = thu hồi (xóa các `Notification` tương ứng) |
| POST | `/system/notifications/dispatch` | cron, `Bearer CRON_SECRET`, không qua IAM (khai trong `test_endpoint_access.py`); `CRON_SECRET` trống thì 404 |

Mã lỗi:

- `NOTIFICATION_EVENT_FORBIDDEN`
- `NOTIFICATION_CHANNEL_UNAVAILABLE`
- `NOTIFICATION_IN_APP_REQUIRED`
- `NOTIFICATION_CHAT_INVALID`
- `PUSH_NOT_CONFIGURED`
- `TELEGRAM_BOT_TOKEN_INVALID`
- `TELEGRAM_BOT_HAS_WEBHOOK`
- `TELEGRAM_BOT_REQUIRED`

---

## 12. Frontend

### 12.1 Chuông (`shares` không import module, nên chuông nằm ở `modules/system`, gắn vào `AdminShell` header qua slot)

- `NotificationBell`: icon `Bell` (lucide), badge tổng chưa đọc (`99+`).
- `NotificationPopover` (popover, rộng 380px; dưới `md` là `Sheet` toàn màn):
  - `Tabs`: **Cá nhân** (badge số chưa đọc) | **Hệ thống** (badge);
  - danh sách vô hạn (`useInfiniteQuery`, 20/lần);
  - mỗi dòng: icon theo mức (`Info`, `TriangleAlert`, `CircleX`, màu `--info`/`--warning`/`--destructive`), tiêu đề,
    nội dung 2 dòng, thời gian tương đối, chấm chưa đọc;
  - bấm dòng: đánh dấu đã đọc, rồi điều hướng `link`;
  - đầu popover: "Đánh dấu đã đọc tất cả" (theo tab), nút bánh răng → Hồ sơ → Thông báo;
  - trạng thái loading/empty/error dùng common có sẵn.
- `NotificationPushPrompt`: thanh nhỏ trong popover "Bật thông báo trên trình duyệt" (điều kiện ở mục 10).
- Hook mỗi file một hook: `use-notifications.ts`, `use-unread-count.ts`, `use-mark-read.ts`,
  `use-push-registration.ts`, `use-notification-realtime.ts` (onMessage + polling + BroadcastChannel).
- Service mỗi model một file: `notification.service.ts`, `notification-preference.service.ts`,
  `push-device.service.ts`, `telegram-bot.service.ts`, `telegram-chat.service.ts`,
  `notification-delivery.service.ts`, `announcement.service.ts`.
- `src/shares/lib/firebase-messaging.ts`: khởi tạo app/messaging lười (chỉ khi có config và trình duyệt hỗ trợ).
  Không import module.
- `public/notification-sw.js`: service worker (mục 8.2).

### 12.2 Hồ sơ cá nhân → tab "Thông báo"

`profile-dialog.tsx` chỉ thêm `TabsTrigger` + `TabsContent` gọi `NotificationSettingsTab`. Các khối là component
riêng:

1. `PushDeviceCard`: trạng thái trình duyệt này, nút bật/tắt, danh sách thiết bị đã đăng ký (xóa được).
2. `TelegramBotCard`: hướng dẫn tạo bot ở @BotFather, dán token, kiểm tra, đổi/xóa.
3. `TelegramChatList`: đăng ký nhóm/chat riêng bằng mã, gửi thử, bật/tắt.
4. `NotificationPreferenceMatrix`:
   - hàng là sự kiện (nhóm theo module, tên + mô tả + mức mặc định);
   - cột: Trong app, Trình duyệt, Email, Telegram (chọn chat);
   - ô `IN_APP` của sự kiện ERROR bị khóa;
   - lưu bằng `useSync…`.

Hiện/ẩn theo bảng mục 10.

### 12.3 Hệ thống

- **Nhật ký thông báo** (`/quan-tri/he-thong/nhat-ky-thong-bao`): `DataTable` delivery (thời gian, sự kiện, kênh,
  người nhận, trạng thái, lỗi, gửi lại), lọc `FilterSelect`.
- **Gửi thông báo** (`/quan-tri/he-thong/gui-thong-bao`): danh sách đã gửi + `AnnouncementForm` (`FormPage`: tiêu
  đề, nội dung, mức, link, đối tượng tất cả/theo vai trò bằng `ChoiceList`, hết hạn).
- Bỏ màn cấu hình route cũ: `notification-panel.tsx`, `use-notification-panel.ts`, `use-notification-settings.ts`.

---

## 13. Cấu hình Firebase và biến môi trường

Các bước (ghi vào `docs/guides/notification-setup.md`):

1. console.firebase.google.com → tạo project (không cần Analytics).
2. Project settings → General → **Add app** → Web → lấy config (apiKey, projectId, messagingSenderId, appId).
3. Project settings → Cloud Messaging → **Web Push certificates** → Generate key pair → lấy **VAPID public key**.
4. Project settings → Service accounts → **Generate new private key** → file JSON. Base64 file này rồi đặt vào biến
   backend. Không commit, không dán vào chat.
5. Bật **Firebase Cloud Messaging API (V1)** trong Google Cloud Console của project.
6. Cron ngoài: cron-job.org tạo job `POST https://api.toannx.com/api/v1/system/notifications/dispatch`, header
   `Authorization: Bearer <CRON_SECRET>`, mỗi 1–5 phút.

Biến môi trường (thêm vào `.env.example` kèm chú thích tiếng Việt, và vào `deployment.md`):

| Biến | Nơi | Bí mật | Ghi chú |
|---|---|---|---|
| `FIREBASE_PROJECT_ID` | backend | không | trống thì tắt kênh PUSH |
| `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` | backend | **có** (để trống trong example) | service account để gọi FCM |
| `NOTIFICATION_DISPATCH_BUDGET_SECONDS` | backend | không | mặc định 5 |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | frontend | không (key web công khai) | |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | frontend | không | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | frontend | không | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | frontend | không | |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | frontend | không (public key) | |

Bỏ biến `TELEGRAM_BOT_TOKEN`.

---

## 14. Các phase

Thứ tự trong đợt chung: **N1–N7 làm ngay sau phase 1 (vai trò thành viên) của plan finance và trước phase 8 (SePay)**.

| Phase | Việc | Xong khi |
|---|---|---|
| **N0. Duyệt** | chốt D1–D3; `uv add google-auth`, `pnpm add firebase` | đã cài |
| **N1. Core** | `SecretCipher`; mở rộng `NotificationEventDefinition` + validate; `ModuleDescriptor` kiểm sự kiện | test core qua |
| **N2. Model** | `migrate system 0008`, xóa `0009` cũ; model mục 4 + migration; repository | migrate chạy lại được |
| **N3. Gửi** | `NotificationService.notify/notify_many`, `NotificationDispatcher`, `FcmClient`, `TelegramClient` theo bot người dùng, template email; cron endpoint dispatch; cleanup tasks | test 15.1–15.3 qua (fake FCM/Telegram/email) |
| **N4. Telegram + tùy chọn** | bot/chat theo người dùng; preferences API; bỏ route cũ và `TELEGRAM_BOT_TOKEN` | test 15.4 qua |
| **N5. Sự kiện** | khai sự kiện mục 9; nối `AuthService`/`OAuthService` (login, thiết bị mới, đổi mật khẩu), `r2_usage_service` (quota), announcement; finance dùng ở phase 8 của plan finance | test 15.5 qua |
| **N6. Frontend** | chuông + popover 2 tab, realtime (FCM + polling + BroadcastChannel), service worker, Hồ sơ → Thông báo, Nhật ký, Gửi thông báo; CSP; messages vi/en | eslint/prettier/typecheck, unit test hook realtime, `pnpm build` qua |
| **N7. Tài liệu** | `notification-setup-guide.md`, `.env.example` (2 nơi), `deployment.md` (cron ngoài, biến Firebase), `common-catalog.md` (`notify`, `NotificationEventDefinition`, `SecretCipher`, `firebase-messaging`), `SYSTEM_CONTEXT.md`; rule backend: "module phát thông báo chỉ qua `NotificationService.notify`, sự kiện khai `scope`/`audience`/`permission`"; `AGENTS.md`/`CLAUDE.md`/`prompt.md` | soát xong |
| **N8. E2E** | `notifications.spec.ts` (15.6); kiểm tay popup thật trên Chrome với project Firebase test | qua |

---

## 15. Kịch bản test

Mọi client ngoài (FCM, Telegram, email) dùng fake. Không gọi Firebase thật trong test tự động.

### 15.1 `notify` và người nhận

| # | Hành động | Kết quả |
|---|---|---|
| A1 | `notify("finance.income.received", recipient=A)`, A chưa chỉnh tùy chọn, có 2 `PushDevice` | 1 `Notification` (PERSONAL, INFO) cho A; 2 delivery PUSH |
| A2 | Gọi lại cùng `dedup_key` | không tạo thêm |
| A3 | `notify` sự kiện OWNER không truyền `recipient` | `ImproperlyConfigured` |
| A4 | A không có `finance.income.read` | không tạo gì |
| A5 | `notify_many("system.announcement")` cho 3 user, 1 user bị khóa | 2 `Notification` (SYSTEM) |
| A6 | `system.notification.delivery_failed` (SUBSCRIBERS, quyền `manage_all`): chỉ admin có quyền | chỉ admin nhận |
| A7 | A tắt PUSH cho `finance.income.received` | chỉ `Notification`, không delivery PUSH |
| A8 | A cố tắt IN_APP của sự kiện ERROR | 400 `NOTIFICATION_IN_APP_REQUIRED` |

### 15.2 Không ảnh hưởng nghiệp vụ

| # | Hành động | Kết quả |
|---|---|---|
| B1 | DB lỗi khi tạo `Notification` (giả lập) trong webhook SePay | giao dịch thu nhập **vẫn được lưu**, webhook trả 200, log `notification.notify_failed` |
| B2 | FCM fake treo 10 giây | request trả trong khoảng ngân sách 5 giây cộng thời gian xử lý; delivery còn `PENDING` |
| B3 | Đăng nhập khi `notify` ném lỗi | đăng nhập vẫn thành công |
| B4 | Transaction nghiệp vụ rollback sau khi gọi `notify` | không còn `Notification` / delivery nào |

### 15.3 Gửi và retry

| # | Hành động | Kết quả |
|---|---|---|
| C1 | FCM trả 503 | `attempts 1`, `next_attempt_at` +1 phút, `PENDING` |
| C2 | 5 lần lỗi tạm liên tiếp | `FAILED`, phát `system.notification.delivery_failed` |
| C3 | FCM trả `UNREGISTERED` | `FAILED`, `PushDevice.is_active = false` |
| C4 | Hai dispatcher chạy cùng lúc | mỗi delivery gửi đúng một lần |
| C5 | A bị thu hồi quyền trước khi cron gửi | `SKIPPED` (`NOTIFICATION_PERMISSION_REVOKED`) |
| C6 | Cron gọi dispatch sai `CRON_SECRET` | 401; `CRON_SECRET` trống thì 404 |
| C7 | Firebase chưa cấu hình | không tạo delivery PUSH; `events` không trả kênh PUSH |

### 15.4 Telegram và tùy chọn

| # | Hành động | Kết quả |
|---|---|---|
| T1 | A lưu token bot (fake `getMe` ok) | lưu mã hóa; API trả `username`, `token_last4` |
| T2 | Token sai | 400 `TELEGRAM_BOT_TOKEN_INVALID` |
| T3 | Bot đang đặt webhook | "Kiểm tra" trả `TELEGRAM_BOT_HAS_WEBHOOK` |
| T4 | A đăng ký nhóm bằng mã | chat `VERIFIED`, thuộc A |
| T5 | B chưa có bot mà đăng ký chat | 400 `TELEGRAM_BOT_REQUIRED` |
| T6 | B chọn chat của A trong tùy chọn | 400 `NOTIFICATION_CHAT_INVALID` |
| T7 | A bật Telegram cho `finance.income.received`; webhook SePay của A ghi tiền vào | delivery Telegram tới chat của A, gửi bằng bot của A; B không nhận gì |
| T8 | A xóa bot khi còn delivery chờ | `SKIPPED` (`TELEGRAM_BOT_MISSING`) |
| T9 | Đổi `DJANGO_SECRET_KEY` (override) rồi gửi | `FAILED` `TELEGRAM_BOT_TOKEN_INVALID`, bot báo cần nhập lại token |

### 15.5 Sự kiện cụ thể

| # | Hành động | Kết quả |
|---|---|---|
| E1 | A đăng nhập bằng mật khẩu | `system.auth.login` (PERSONAL, INFO) |
| E2 | A đăng nhập từ user agent/IP mới | thêm `system.auth.new_device` (WARNING) + email |
| E3 | Webhook SePay S1 (plan finance) | `finance.income.received` cho owner kết nối: "Tiền vào 9.200.000 ₫ · Facebook" |
| E4 | Webhook S25 (không rõ số tiền) | `finance.income.needs_review` (WARNING) |
| E5 | Admin gửi thông báo tới vai trò `FINANCE_MEMBER` | chỉ thành viên vai trò đó nhận, ở tab Hệ thống |
| E6 | Admin thu hồi thông báo đó | dòng biến mất khỏi chuông người nhận |
| E7 | Thông báo hệ thống có `expires_at` đã qua | không hiện trong chuông và số chưa đọc |

### 15.6 Giao diện (E2E, fake realtime bằng polling)

| # | Hành động | Kết quả |
|---|---|---|
| U1 | A có 2 thông báo cá nhân chưa đọc, 1 hệ thống | badge 3; tab Cá nhân 2, Hệ thống 1 |
| U2 | Bấm thông báo tiền vào | đánh dấu đã đọc, mở đúng giao dịch, badge giảm |
| U3 | "Đánh dấu đã đọc tất cả" ở tab Cá nhân | chỉ tab Cá nhân về 0 |
| U4 | Tạo thông báo mới qua API khi đang mở trang | sau chu kỳ polling, badge tăng (realtime thật kiểm tay với Firebase) |
| U5 | Mức WARNING/ERROR | icon và màu đúng token |
| U6 | User không có quyền Telegram | Hồ sơ → Thông báo không có khối Telegram, không có cột Telegram |
| U7 | User không có `system.notification_preference.read` | không có tab Thông báo |
| U8 | Màn mobile | chuông mở dạng Sheet toàn màn |

Kiểm tay (không tự động): bật thông báo trên Chrome, đóng tab, gửi webhook test → thấy popup hệ điều hành; bấm popup
→ mở đúng trang.

---

## 16. Ngoài phạm vi

- WebSocket trên hạ tầng hiện tại (xem D1). Có thể thêm sau qua `RealtimeTransport` nếu chuyển backend sang máy chạy
  liên tục.
- App mobile native, SMS, Zalo.
- Lịch gửi thông báo hẹn giờ, mẫu thông báo do người dùng soạn.
- Thông báo theo thời gian thực trong trang public cho khách chưa đăng nhập.
