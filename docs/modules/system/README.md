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
| Thông báo | `Notification`, `NotificationDelivery`, `NotificationPreference`, `PushDevice`, `TelegramChat`, `SystemAnnouncement` |
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

Trang công khai/đăng nhập: đăng nhập (mọi tài khoản mặc định vào Client Portal `/portal`; Admin tự chuyển sang `/admin` qua `UserMenu`), quên/đặt lại mật khẩu, xác thực email, lời mời, callback OAuth, trang mở
file riêng tư `/tep/{id}`. Chuông thông báo chuẩn hóa link cũ `/admin/finance/...` và `/admin/sessions` về `/portal/...`.

## Sự kiện thông báo

`system.auth.login`, `system.auth.new_device`, `system.auth.password_changed`, `system.announcement.published`,
`system.notification.delivery_failed`, `system.storage.quota_warning`, `system.database.quota_warning` (cron dọn dẹp
đo `pg_database_size`, cảnh báo từ 80% của `DATABASE_MAX_BYTES`) (hằng ở `constants/system_notification_event.py`).

## Webhook / Callback

- Callback: `system.google_oauth`, `system.github_oauth` (đăng nhập Google/GitHub), xem
  [../../guides/oauth.md](../../guides/oauth.md).
- Webhook `system.notification_dispatch` — `POST /api/v1/system/notifications/dispatch`: Upstash QStash gọi sau
  khi có thông báo (chữ ký `Upstash-Signature`, luôn gửi) và cron-job.org gọi mỗi 10 phút (`Bearer CRON_SECRET`;
  mốc `notification:next_due` trong Redis chưa tới thì trả `sent=0`, không chạm DB; khi rảnh đặt `IDLE_RECHECK_SECONDS = 24 giờ`). Xem
  [../../guides/notification-setup.md](../../guides/notification-setup.md).
- Cache Redis công khai (`SettingService`): `get_public_settings()` cache các cài đặt `is_public=True` trong `600 giây` (namespace `system:settings:public`), tự tăng version sau commit khi `set_setting_value()` cập nhật để giảm SQL khi mở trang đăng nhập/trang chủ.
- Cache Redis dung lượng R2 (`AttachmentService`): `get_current_storage_usage_bytes()` cache `300 giây` (`system:storage:r2_usage_bytes`), ngoại trừ kiểm tra trần dung lượng khi upload `create()` luôn truyền `use_cache=False` để lấy số đo tươi và tự vô hiệu hóa cache sau commit khi thay đổi/purge tệp.
- Polling FE (`useUnreadCount`): hỏi lại chuông ở tab foreground mỗi `15 phút` khi tắt Push / `30 phút` khi bật Push (`staleTime` `2 phút` / `5 phút`); `usePushRegistration` khử trùng đăng ký thiết bị trong `24 giờ` qua `localStorage` (`system_push_device_sync`).

## Gửi thông báo

- `notify` chỉ ghi `Notification` + `NotificationDelivery(PENDING)`; **request không gọi FCM/SMTP/Telegram**. Sau
  commit đá `NotificationKickService` một lần cho cả request (mốc Redis `notification:next_due` + tin QStash).
- Lỗi tạm → `next_attempt_at` theo lùi dần 1/5/15/60/240 phút và hẹn QStash gọi lại đúng lúc đó.
- Token bot Telegram chung đọc từ ENV (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, webhook `POST /api/v1/system/telegram/webhook` xác thực bằng header `X-Telegram-Bot-Api-Secret-Token` dẫn xuất từ `DJANGO_SECRET_KEY`); module khác có thể đăng ký callback nhận tin nhắn qua `ModuleRegistry.register_telegram_update_handler`. Khi Telegram trả 401/403/404 cho đích nhận `TelegramChat` → đánh dấu lỗi `TELEGRAM_CHAT_UNREACHABLE`, một bản `FAILED` + cảnh báo.
- `NotificationService.notify(..., kick=False)` hỗ trợ phát hàng loạt và dồn một lần gọi `NotificationService.flush_kick()`.
- Tin Telegram/email dựng bằng `NotificationMessageFormatter`: `<icon> <b>Tiêu đề</b>`, các dòng `details`, `🕒 Thời gian`,
  `👉 Xem chi tiết`. Icon sự kiện: đăng nhập 🔐, thiết bị mới 🛡️, đổi mật khẩu 🔑, thông báo hệ thống 📢, gửi lỗi 🚨,
  dung lượng R2 💾, dung lượng DB 🗄️ (finance: tiền vào 💰, cần xử lý 🧾, webhook sai 🚫).
- Token push hết hạn (`PUSH_TOKEN_INVALID`) chỉ tắt thiết bị, không sinh cảnh báo "gửi thất bại" (`SILENT_FAILURE_CODES`).
- Email theo mẫu (quên mật khẩu, xác minh, lời mời) gửi đồng bộ (`EMAIL_ASYNC=False`, `EMAIL_TIMEOUT=5`).
- Login ghi log `auth.login steps rate_limit=.. authenticate=.. session=.. notify=.. commit_kick=.. profile=..
  total=..` kèm `request_id`; dispatcher ghi `notification.send delivery=.. channel=.. status=.. elapsed=..`.
- Rate limit đếm bằng Redis khi có `REDIS_URL` (không ghi bảng `system_rate_limit_bucket`), lỗi thì về PostgreSQL.

## Chức năng liên quan

- [File công khai và riêng tư](../../features/attachment-visibility.md)
- [Web Push](../../features/web-push.md), [cài đặt thông báo](../../guides/notification-setup.md)
- [Ẩn/khóa theo quyền](../../features/permission-ui.md), [cột Thao tác](../../features/table-actions.md)
- [Xác thực](../../architecture/authentication.md), [phân quyền](../../architecture/authorization.md)
