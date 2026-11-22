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
`system.notification.delivery_failed`, `system.storage.quota_warning` (hằng ở `constants/system_notification_event.py`).

## Webhook / Callback

- Callback: `system.google_oauth`, `system.github_oauth` (đăng nhập Google/GitHub), xem
  [../../guides/oauth.md](../../guides/oauth.md).
- Không nhận webhook.

## Chức năng liên quan

- [File công khai và riêng tư](../../features/attachment-visibility.md)
- [Web Push](../../features/web-push.md), [cài đặt thông báo](../../guides/notification-setup.md)
- [Ẩn/khóa theo quyền](../../features/permission-ui.md), [cột Thao tác](../../features/table-actions.md)
- [Xác thực](../../architecture/authentication.md), [phân quyền](../../architecture/authorization.md)
