# Module System (`system`)

Nền tảng hệ thống: tài khoản, vai trò và phân quyền, đăng nhập và phiên, thư viện file, thông báo, tiền tệ/tỷ giá,
lịch sử thay đổi, danh mục webhook/callback.

- BE: `backend/app/system/` · FE: `frontend/src/modules/system/`
- URL quản trị: `/quan-tri/he-thong/...` (en `/admin/system/...`)

## Model chính

| Nhóm | Model |
| --- | --- |
| Tài khoản | `User`, `UserSocialAccount`, `AuthSession`, `RefreshToken` |
| Phân quyền | `Role`, `Permission`, `RolePermission`, `UserRole`, `RoleAutoGrant` |
| Thư viện | `Attachment`, `AttachmentFolder` |
| Thông báo | `Notification`, `NotificationDelivery`, `NotificationPreference`, `PushDevice`, `TelegramBot`, `TelegramChat`, `SystemAnnouncement` |
| Danh mục | `Currency`, `ExchangeRate`, `Setting` |
| Khác | `JournalEntry` (lịch sử thay đổi), `RateLimitBucket` |

## Quyền

Một class quyền mỗi tài nguyên ở `app/system/permissions/`, mỗi class một file FE cùng tên ở `permissions/`.

| Class | Tài nguyên | `MEMBER` (thành viên) |
| --- | --- | --- |
| `UserPermission` | `user` | không |
| `IamPermission` | `role`, `permission` | không |
| `SessionPermission` | `session` | không |
| `AttachmentPermission` | `attachment` (+ `manage_all`, `read_private`) | read, create, update, delete |
| `AttachmentFolderPermission` | `attachment_folder` | read, create, update, delete |
| `JournalEntryPermission` | `journal_entry` (read, delete) | không |
| `SettingPermission` | `setting` | không |
| `NotificationPermission` | `notification` | read |
| `NotificationPreferencePermission` | `notification_preference` | read, update |
| `PushDevicePermission` | `push_device` | read, create, delete |
| `TelegramBotPermission` | `telegram_bot` | read, create, update, delete |
| `TelegramChatPermission` | `telegram_chat` (+ `manage_all`) | read, create, update, delete |
| `NotificationDeliveryPermission` | `notification_delivery` (read, update = gửi lại, delete, + `manage_all`) | read |
| `AnnouncementPermission` | `announcement` | không |
| `CurrencyPermission` | `currency` | read |
| `ExchangeRatePermission` | `exchange_rate` | read |
| `WebhookPermission` / `CallbackPermission` | danh mục webhook/callback | không |

Cơ chế "của mình / của mọi người": [../../features/permission-scope.md](../../features/permission-scope.md).

## Màn quản trị (sidebar theo cụm)

| Cụm | Màn | Route |
| --- | --- | --- |
| Tài khoản & phân quyền | Người dùng · Phiên · Vai trò · Quyền | `nguoi-dung`, `phien`, `vai-tro`, `quyen` |
| Thư viện | Thư viện file | `thu-vien` |
| Thông báo | Nhật ký thông báo · Gửi thông báo | `nhat-ky-thong-bao`, `gui-thong-bao` |
| Danh mục | Tiền tệ · Tỷ giá | `tien-te`, `ty-gia` |
| Tích hợp | Webhook · Callback | `webhook`, `callback` |
| Vận hành | Cài đặt · Nhật ký thay đổi | `cai-dat`, `nhat-ky` |

Trang công khai/đăng nhập: đăng nhập, quên/đặt lại mật khẩu, xác thực email, lời mời, callback OAuth, trang mở
file riêng tư `/tep/{id}`.

## Sự kiện thông báo

`system.auth.login`, `system.auth.new_device`, `system.auth.password_changed`, `system.announcement.published`,
`system.notification.delivery_failed`, `system.storage.quota_warning`, `system.database.quota_warning` (cron dọn dẹp
đo `pg_database_size`, cảnh báo từ 80% của `DATABASE_MAX_BYTES`) (hằng ở `constants/system_notification_event.py`).

## Webhook / Callback

- Callback: `system.google_oauth`, `system.github_oauth` (đăng nhập Google/GitHub), xem
  [../../guides/oauth.md](../../guides/oauth.md).
- Webhook `system.notification_dispatch` — `POST /api/v1/system/notifications/dispatch`: Upstash QStash gọi sau
  khi có thông báo (chữ ký `Upstash-Signature`, luôn gửi) và cron-job.org gọi mỗi 10 phút (`Bearer CRON_SECRET`;
  mốc trong Redis chưa tới thì trả `sent=0`, không chạm DB). Xem
  [../../guides/notification-setup.md](../../guides/notification-setup.md).

## Gửi thông báo

- `notify` chỉ ghi `Notification` + `NotificationDelivery(PENDING)`; **request không gọi FCM/SMTP/Telegram**. Sau
  commit đá `NotificationKickService` một lần cho cả request (mốc Redis `notification:next_due` + tin QStash).
- Lỗi tạm → `next_attempt_at` theo lùi dần 1/5/15/60/240 phút và hẹn QStash gọi lại đúng lúc đó.
- Token bot Telegram không giải mã được hoặc Telegram trả 401/404 → bot bị tắt (`is_active=False`,
  `last_error_code=TELEGRAM_BOT_TOKEN_INVALID`), một bản `FAILED` + cảnh báo; thông báo sau không tạo bản gửi
  Telegram nữa tới khi lưu lại token.
- Email theo mẫu (quên mật khẩu, xác minh, lời mời) gửi đồng bộ (`EMAIL_ASYNC=False`, `EMAIL_TIMEOUT=5`).
- Login ghi log `auth.login steps rate_limit=.. authenticate=.. session=.. notify=.. commit_kick=.. profile=..
  total=..` kèm `request_id`; dispatcher ghi `notification.send delivery=.. channel=.. status=.. elapsed=..`.
- Rate limit đếm bằng Redis khi có `REDIS_URL` (không ghi bảng `system_rate_limit_bucket`), lỗi thì về PostgreSQL.

## Chức năng liên quan

- [File công khai và riêng tư](../../features/attachment-visibility.md)
- [Web Push](../../features/web-push.md), [cài đặt thông báo](../../guides/notification-setup.md)
- [Ẩn/khóa theo quyền](../../features/permission-ui.md), [cột Thao tác](../../features/table-actions.md)
- [Xác thực](../../architecture/authentication.md), [phân quyền](../../architecture/authorization.md)
