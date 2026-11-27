# Hướng dẫn tạo & cấu hình Telegram Webhook (Nhận tin 2 chiều)

Tài liệu hướng dẫn cách thiết lập để hệ thống nhận cập nhật từ Telegram Bot API (gồm `/start <code>`, thêm/gỡ bot khỏi nhóm, và chat trợ lý AI 2 chiều ở DM lẫn nhóm `@bot`).

## 1. Cơ chế hoạt động trong hệ thống

- **Endpoint nhận Webhook**: `POST /api/v1/system/telegram/webhook` ([SystemTelegramWebhookView](../../backend/app/system/views/system_telegram_webhook_view.py)).
  - Công khai (không CSRF/JWT), xác thực bắt buộc qua HTTP header `X-Telegram-Bot-Api-Secret-Token` do [TelegramBotService.webhook_secret](../../backend/app/system/services/telegram_bot_service.py) dẫn xuất từ `DJANGO_SECRET_KEY` và `TELEGRAM_BOT_TOKEN` (dài 64 ký tự hex, hợp lệ chuẩn Telegram). Sai secret hoặc thiếu token sẽ trả `404`.
  - Chống xử lý trùng lặp theo `update_id` trong Redis.
  - Tự động kích hoạt liên kết chat khi nhận `/start <mã>` hoặc sự kiện `my_chat_member`, sau đó chuyển tiếp sang [TelegramAssistantRouterService](../../backend/app/workspace/services/telegram_assistant_router_service.py).
- **Xử lý bất đồng bộ (QStash)**:
  - Lệnh slash (`/hom_nay`, `/spending`, `@bot /spending`...) chạy đồng bộ ngay (< 200ms, 0 token AI).
  - Câu hỏi tự nhiên (`@bot hôm nay có gì`) nếu có Upstash QStash sẽ đẩy 1-hop sang `POST /api/v1/workspace/assistant/telegram-process` để webhook trả `200 OK` tức thì, tránh Telegram retry do timeout.
- **Loại sự kiện đăng ký (`allowed_updates`)**: `["message", "my_chat_member"]` ([TelegramClient.set_webhook](../../backend/app/system/services/telegram_client.py)).

---

## 2. Cài đặt trên Production (HTTPS Public)

Theo tài liệu Telegram Bot API, `setWebhook` **bắt buộc dùng URL HTTPS công khai** (Telegram từ chối `http://` hoặc `localhost`).

### Bước 1: Kiểm tra biến môi trường Backend

Đảm bảo máy chủ Backend (ví dụ Vercel) đã có đủ các biến:

- `TELEGRAM_BOT_TOKEN`: token lấy từ `@BotFather`.
- `TELEGRAM_BOT_USERNAME`: username bot (không cần `@`, ví dụ `ToanNXPlatformBot`).
- `DJANGO_SECRET_KEY`: khóa bí mật Django ổn định giữa các lần deploy để `X-Telegram-Bot-Api-Secret-Token` không đổi.
- `XKIRO_API_KEY`: khóa AI để bot trả lời câu hỏi tự nhiên.
- `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`: khuyến nghị bật để không timeout webhook khi gọi AI.
- URL webhook được tự động tạo từ `scheme` + `Host` của request hiện tại (`build_backend_url`, ví dụ `https://api.toannx.com/api/v1/system/telegram/webhook`), nên không cần cấu hình domain thủ công.

### Bước 2: Tắt Group Privacy Mode trên `@BotFather` (bắt buộc nếu chat trong nhóm)

Mặc định Telegram bật Privacy Mode (`can_read_all_group_messages: false`), khiến bot trong nhóm có thể bỏ sót tin nhắn thường hoặc tin nhắn reply. Để bot nhận đủ tin nhắn khi được `@tag` hoặc trả lời trong nhóm:

1. Mở `@BotFather` trên Telegram → gửi `/mybots` → chọn bot của bạn.
2. Chọn **Bot Settings** → **Group Privacy** → **Turn off** (màn hình báo `Privacy mode is disabled`).
3. **Quan trọng theo quy định Telegram**: nếu bot đang ở sẵn trong nhóm trước khi tắt Privacy Mode, bạn **phải xóa bot khỏi nhóm rồi thêm lại** (hoặc **cấp quyền Admin nhóm** cho bot) thì thay đổi mới có hiệu lực.

### Bước 3: Đăng ký Webhook với Telegram

Dùng **1 trong 2 cách** sau (hệ thống tự gắn `url` + `secret_token` + `allowed_updates`):

- **Cách A — Qua giao diện quản trị (khuyến nghị)**:
  1. Đăng nhập tài khoản có quyền `system.setting.update` trên trang web production.
  2. Vào **Hồ sơ → Thông báo** (hoặc màn quản trị Bot Telegram), tại card **Bot Telegram hệ thống** bấm nút **Kiểm tra bot** (gọi `POST /api/v1/system/telegram/bot/check`).
  3. Kiểm tra kết quả trả về: `webhook_active: true`, `webhook_url: "https://api.toannx.com/api/v1/system/telegram/webhook"`, `last_error_code: ""`.

- **Cách B — Qua CLI Django (khi cần kiểm tra trực tiếp)**:
  ```bash
  uv run python manage.py shell -c "from app.system.services.telegram_bot_service import TelegramBotService; print(TelegramBotService().check('https://api.toannx.com/api/v1/system/telegram/webhook'))"
  ```

> **Lưu ý quan trọng**: Không gọi `getWebhookInfo` bằng URL chứa token lên log/tài liệu công khai; chỉ dùng API kiểm tra của hệ thống hoặc chạy script nội bộ không in token.

### Bước 4: Liên kết tài khoản & nhóm ở Hồ sơ

Bot **chỉ trả lời các chat đã được đăng ký** (`TelegramChat` trạng thái `ACTIVE`, `is_active=True`):

1. Vào **Hồ sơ → Thông báo → Telegram** trên web.
2. Liên kết **Chat riêng (DM)** với bot (bấm nút mở Telegram và gửi `/start <mã>`).
3. Nếu dùng trong nhóm: liên kết thêm **Nhóm** (mời bot vào nhóm, bấm **Kiểm tra** trên web để lưu `chat_id` âm của nhóm).
   - Với policy mặc định `OWNER_ONLY` trong nhóm, hệ thống đối chiếu người gửi tin nhắn (`from.id`) với **DM cá nhân** đã liên kết ở bước 2. Nếu chỉ liên kết nhóm mà chưa liên kết DM, bot coi người gửi là khách (`is_owner=False`) và không dùng được dữ liệu cá nhân.

---

## 3. Chạy & kiểm thử ở Local (`localhost`)

Telegram **không thể gửi webhook tới `http://localhost:8001`**. Ở máy cá nhân có 2 cách làm việc:

### Cách A: Dùng Long-Polling `poll_telegram_assistant` (khuyến nghị)

1. Đảm bảo `backend/.env.local` có `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `XKIRO_API_KEY`.
2. Liên kết **DM** và **Nhóm** trên web local (`http://localhost:3001`) để DB PostgreSQL local có bản ghi `TelegramChat`.
3. Chạy lệnh trong `backend/`:
   ```powershell
   uv run python manage.py poll_telegram_assistant
   ```
4. **Lưu ý xung đột `getUpdates` vs `setWebhook`**: theo tài liệu Telegram Bot API, **không thể bật đồng thời webhook và polling trên cùng một bot token**. Nếu bot đang gắn webhook production, `getUpdates` sẽ báo lỗi `409 Conflict`. Nên dùng **bot dev riêng** ở `.env.local` khi test local.

### Cách B: Mở tunnel HTTPS tạm để test đúng luồng Webhook ở local

1. Chạy backend local cổng `8001` và mở tunnel HTTPS (ví dụ Cloudflare Tunnel hoặc ngrok):
   ```powershell
   cloudflared tunnel --url http://localhost:8001
   ```
2. Mở trang quản trị qua domain HTTPS của tunnel (để `build_backend_url` nhận `https://...`), rồi bấm **Kiểm tra webhook** trên UI để Telegram trỏ webhook về tunnel.
4. Nhớ chạy lại **Kiểm tra bot** trên môi trường production (hoặc dùng bot dev riêng) sau khi test xong để không làm gián đoạn webhook production.

---

## 4. Xử lý sự cố nhanh khi bot không trả lời

| Triệu chứng | Nguyên nhân thường gặp | Cách kiểm tra & khắc phục |
| --- | --- | --- |
| Gửi tin nhắn trên nhóm không thấy phản hồi, log backend không có request | `getWebhookInfo.url` rỗng hoặc trỏ sai domain | Bấm **Kiểm tra bot** ở Production; ở local phải chạy `poll_telegram_assistant` |
| Webhook báo lỗi `404` ở `last_error_message` | `DJANGO_SECRET_KEY` hoặc `TELEGRAM_BOT_TOKEN` đổi sau khi `setWebhook` | Bấm **Kiểm tra bot** lại để đồng bộ `secret_token` mới |
| Chat DM được nhưng `@bot chào` trong nhóm không thấy update tới server | Privacy Mode đang bật (`can_read_all_group_messages: false`) | Tắt **Group Privacy** ở `@BotFather` rồi xóa bot khỏi nhóm và thêm lại (hoặc cấp quyền Admin nhóm) |
| Server nhận được update nhưng bot im lặng | Nhóm/DM chưa liên kết trong DB hiện tại (`unregistered_chat`) | Kiểm tra **Hồ sơ → Thông báo → Telegram** trên đúng môi trường (local/prod) đã có bản ghi hoạt động chưa |
| `@bot hôm nay có gì` báo không xem được dữ liệu cá nhân | Policy nhóm là `OWNER_ONLY` nhưng người nhắn chưa liên kết DM với bot | Liên kết thêm **Chat riêng (DM)** với bot cùng tài khoản đó |
| Lỗi `409 Conflict` khi chạy `poll_telegram_assistant` | Bot token này đang bật webhook ở môi trường khác | Dùng bot dev riêng cho `.env.local` hoặc gỡ webhook trước khi polling |
