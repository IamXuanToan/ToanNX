---
trigger: model_decision
description: Dùng khi phát, gửi, sửa nội dung thông báo hoặc kênh chuông, Web Push Firebase, Telegram, email, QStash, cron gửi thông báo.
---

# Thông báo (chuông, Web Push, Telegram, email)

Chi tiết: `docs/rules/backend.md` §9, `docs/features/web-push.md`, `docs/guides/notification-setup.md`,
`docs/modules/system/README.md` mục "Gửi thông báo".

## Phát

- Module chỉ phát qua `NotificationService.notify(event_code, recipient=..., dedup_key=..., payload=...)`. Không tự
  gửi email/Telegram/push, không đọc model thông báo.
- Sự kiện khai trong `ModuleDescriptor.notification_events`: `scope`, `audience` (`OWNER` phải truyền `recipient`),
  `permission`, `default_level`, `default_channels`, **`icon`** (emoji đầu tin Telegram/email).
- `NotificationPayload`: `title`, `body` **ngắn** (chuông, popup), **`details`** là các dòng
  `("<emoji> Nhãn", giá trị)` cho Telegram/email, `link` (đường dẫn FE nội bộ), `message_key` + `params` (FE dịch;
  tên tham số một từ, vì `apiClient` đổi snake_case → camelCase).
- Không đưa chuỗi thô dài (User-Agent, JSON) vào thông báo; thiết bị dùng `describe_user_agent`.

## Gửi

- **Request không bao giờ gọi FCM/SMTP/Telegram.** `notify` chỉ ghi outbox; sau commit đá `NotificationKickService`
  (QStash gọi lại `POST /system/notifications/dispatch` ở lượt function riêng). cron-job.org mỗi 10 phút là lưới an
  toàn và không chạm DB khi mốc Redis chưa tới. Ngoại lệ duy nhất: nút "Gửi lại".
- **Chia lô (batch) khi gửi cho nhiều người dùng**: không `for user in users:` xử lý dồn một cục hoặc truyền mảng
  `IN (...)` không giới hạn; `NotificationService._create`, `NotificationPreferenceService.resolve`/`resolve_explicit`,
  `bulk_create` outbox và cron gửi hàng loạt bắt buộc chia lô theo `NOTIFICATION_BULK_BATCH` (500/lô) kèm giới hạn
  thời gian chạy.
- Thiết bị nhận push được chốt **lúc tạo thông báo**: thiết bị đăng ký sau đó không nhận thông báo cũ.
- Lỗi tạm → lùi dần 1/5/15/60/240 phút; token push hết hạn chỉ tắt thiết bị, không cảnh báo; lỗi bot Telegram chung
  từ `TELEGRAM_BOT_TOKEN` hoặc chat bị chặn (401/403/404) → đánh dấu lỗi đích nhận / cảnh báo một lần.
- **Một Bot Telegram chung toàn hệ thống**: chỉ dùng bot ENV (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`) và hiển
  thị `@username` bot qua `TelegramBotService`; không lưu bot token riêng từng user vào DB/Setting; nhóm/chat đích
  (`TelegramChat`) do từng người dùng tự cấu hình.
- Khuôn tin Telegram/email do `NotificationMessageFormatter` dựng (icon + tiêu đề, `details`, giờ Việt Nam, link).
- Popup trình duyệt do `public/notification-sw.js` hiện (tiêu đề `ToanNX · …`, icon `brand/notification-icon.png`);
  token FCM gắn với origin đã đăng ký.

## Test

Mock `FcmClient`/`TelegramClient`/`QstashClient`; gửi bằng `dispatch_pending()` thay vì kỳ vọng gửi trong `notify`.
