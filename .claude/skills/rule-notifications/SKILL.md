---
name: rule-notifications
description: "Dùng khi phát, gửi, sửa nội dung thông báo hoặc kênh chuông, Web Push Firebase, Telegram, email, QStash, cron gửi thông báo."
---

<!-- Sinh tự động từ .agents/rules/50-notifications.md bằng scripts/sync-ai-rules.py. Không sửa tay. -->

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
- Thiết bị nhận push được chốt **lúc tạo thông báo**: thiết bị đăng ký sau đó không nhận thông báo cũ.
- Lỗi tạm → lùi dần 1/5/15/60/240 phút; token push hết hạn chỉ tắt thiết bị, không cảnh báo; token bot Telegram
  hỏng → tắt bot, cảnh báo một lần.
- Khuôn tin Telegram/email do `NotificationMessageFormatter` dựng (icon + tiêu đề, `details`, giờ Việt Nam, link).
- Popup trình duyệt do `public/notification-sw.js` hiện (tiêu đề `ToanNX · …`, icon `brand/notification-icon.png`);
  token FCM gắn với origin đã đăng ký.

## Test

Mock `FcmClient`/`TelegramClient`/`QstashClient`; gửi bằng `dispatch_pending()` thay vì kỳ vọng gửi trong `notify`.
