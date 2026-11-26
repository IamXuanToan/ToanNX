# Module Workspace (`workspace`)

Trợ lý cá nhân toàn diện trong Client Portal (`/ca-nhan` · `/en/portal`) và Quản trị Chatbot AI dùng chung trong Admin (`/quan-tri/he-thong/tro-ly-ai`): theo dõi Thiết bị & Bảo hành/Sửa chữa, Dịch vụ định kỳ & Lịch sử thanh toán gia hạn, Két sắt bí mật mã hóa AES-256, Nhắc việc cá nhân (kèm tùy chọn kênh thông báo Website/Telegram/Email theo từng bản ghi), Lịch tổng hợp 4 nguồn, Bản tin Digest tự động và Chatbot AI 1 luồng Web + Telegram (OpenAI-compatible `xKiro`).

- BE: `backend/app/workspace/` · FE: `frontend/src/modules/workspace/`
- URL Portal: `/ca-nhan/...`, `/en/portal/...`
- URL Admin: `/quan-tri/he-thong/tro-ly-ai`, `/en/admin/system/assistant` (gắn chung trong menu Hệ thống → Vận hành, dùng chuẩn `FormPage`/`FormLayout` như các danh mục Hệ thống)
- Phụ thuộc: `system`, `finance`, `utilities`, `novel`.

## Model (9 models)

| Model                   | Mục đích & điểm chính                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Asset`                 | Thiết bị cá nhân: định danh (`brand`, `model_code`, `serial_number`, `imei`, `specs`), giá mua quy đổi VNĐ chặt chẽ theo `WorkspaceExchangeService` (ngoại tệ thiếu tỷ giá → `400 WORKSPACE_CURRENCY_RATE_REQUIRED`), hóa đơn/chứng từ **riêng tư** (`M2M Attachment`), tính `warranty_end_date` (kẹp cuối tháng `add_months_clamped`), `notification_channels` (`["WEBSITE"]` mặc định, tùy chọn `TELEGRAM`/`EMAIL`). Có `JournalTracker`.                 |
| `AssetWarrantyClaim`    | Phiếu bảo hành / sửa chữa gắn `Asset` (`WARRANTY`, `PAID_REPAIR`, `MAINTENANCE`), trạng thái, trung tâm bảo hành, ngày hẹn/nhận trả, chi phí quy đổi VNĐ, tệp biên nhận riêng tư (`M2M Attachment`). Có `JournalTracker`.                                                                                                                                                                                                                                 |
| `Subscription`          | Dịch vụ định kỳ (`WEEKLY`, `MONTHLY`, `QUARTERLY`, `SEMI_ANNUAL`, `YEARLY`, `CUSTOM_DAYS` + `anchor_day`), tiền tệ + tỷ giá quy đổi VNĐ, `renew_date`, `reminder_days_before`, `notification_channels` (`["WEBSITE"]` mặc định, tùy chọn `TELEGRAM`/`EMAIL`). Có `JournalTracker`.                                                                                                                                                                         |
| `SubscriptionPayment`   | Lịch sử thanh toán gia hạn nguyên tử sinh từ `POST /subscriptions/{id}/renew` (có `period_from`..`period_to`, lấy tỷ giá tại ngày `paid_on`, gắn biên lai riêng tư `receipt_attachment`). Có `JournalTracker`.                                                                                                                                                                                                                                               |
| `VaultItem`             | Két sắt bí mật: trường `secret_encrypted` mã hóa qua `SecretCipher` (purpose `"workspace.vault.secret"`), `secret_last4`, `tags`. API đọc (`list`/`retrieve`/AI tools) **không bao giờ** trả `secret`; giải mã tách riêng ở `POST /vault-items/{id}/reveal` (quyền `workspace.vault_item.reveal`, ghi audit `JournalTracker`). Có `JournalTracker`.                                                                                                          |
| `Reminder`              | Nhắc việc cá nhân (`due_date`, `due_time`, `notify_minutes_before`, `priority`, `is_completed`, `recurrence`, `anchor_day`, `tags`, `notification_channels` gồm `WEBSITE`/`TELEGRAM`/`EMAIL`). Hoàn thành nhắc việc lặp sẽ tự sinh nhắc việc kỳ kế tiếp. Có `JournalTracker`.                                                                                                                                                                            |
| `WorkspaceSetting`      | Cấu hình cá nhân (unique theo `owner` khi `deleted_at IS NULL`): `timezone`, `daily_digest_enabled`, `digest_time_slots`, `digest_sections`, `warranty_alert_days`, `subscription_default_alert_days`, `telegram_owner_user_id`, `telegram_allowed_chat_ids`. Không lưu cấu hình Chatbot AI. Có `JournalTracker`.                                                                                                                                           |
| `AssistantConversation` | Luồng chat Trợ lý AI: Web dùng **đúng 1 luồng duy nhất** mỗi user (`channel="WEB"`), Telegram lưu theo `external_chat_id` (`TELEGRAM_DM`, `TELEGRAM_GROUP`).                                                                                                                                                                                                                                                                                                 |
| `AssistantMessage`      | Tin nhắn trong luồng chat (`USER`/`ASSISTANT`/`TOOL`/`SYSTEM`, lưu `sender_telegram_id`, `tool_calls`, `model_used`, `tokens_used`, `contains_private_data`).                                                                                                                                                                                                                                                                                                |

> Cấu hình Chatbot AI dùng chung toàn hệ thống (Avatar công khai `assistant_avatar_id`, Tên `assistant_name`, Policy `assistant_system_prompt`, Model ưu tiên, Giới hạn token ngày, Quy tắc Bot Telegram nhóm/DM) lưu tập trung tại `system.Setting` (`SettingKey.WORKSPACE_ASSISTANT_CONFIG`), được data migration `0004_seed_assistant_default_policy` khởi tạo sẵn Policy an toàn chuẩn (cấm khủng bố, quân sự, phân biệt vùng miền & bảo mật Két sắt), chỉ Admin cấu hình qua `/api/v1/workspace/assistant/config`.

## Quyền (11 nhóm quyền)

Mọi quyền tài nguyên cá nhân đều có `MEMBER` và `MANAGE_ALL`; `AssistantConfigPermission` **không** thuộc `MEMBER` (chỉ Admin):

| Class                          | Tài nguyên             | `MEMBER`                                 |
| ------------------------------ | ---------------------- | ---------------------------------------- |
| `AssetPermission`              | `asset`                | read, create, update, delete             |
| `AssetWarrantyClaimPermission` | `warranty_claim`       | read, create, update, delete             |
| `SubscriptionPermission`       | `subscription`         | read, create, update, delete             |
| `SubscriptionPaymentPermission`| `subscription_payment` | read, delete                             |
| `VaultItemPermission`          | `vault_item`           | read, create, update, delete, **reveal** |
| `ReminderPermission`           | `reminder`             | read, create, update, delete             |
| `WorkspaceSettingPermission`   | `workspace_setting`    | read, update                             |
| `AssistantPermission`          | `assistant`            | chat                                     |
| `AssistantConfigPermission`    | `assistant_config`     | _(Chỉ Admin: read, update)_              |
| `WorkspaceDashboardPermission` | `dashboard`            | read                                     |
| `WorkspaceCalendarPermission`  | `calendar`             | read                                     |

> Lưu ý: Mọi tool của Trợ lý AI khi truy cập dữ liệu cá nhân luôn ép `owner_id=actor.pk` ngay cả khi người dùng có `*.manage_all`, đồng thời loại trừ hoàn toàn `VaultItem`.

## Động cơ Cron Serverless & AI

- **Đường W4 (Cảnh báo & Digest DB)**: `POST /api/v1/workspace/cron/tick` kiểm tra mốc Redis `workspace:cron:alerts_next_due` (TTL Redis **24 giờ**, cleanup 03:00 UTC chạy `refresh_cron_schedules` để bảo đảm mỗi ngày luôn truy vấn DB kiểm tra và re-warm lại Redis/QStash kể cả khi Redis mất khóa). Khi đến hạn, QStash gọi `POST /api/v1/workspace/cron/dispatch-due` để quét Reminder, Bảo hành (`Asset`), Dịch vụ (`Subscription`) và Digest theo khung giờ địa phương. Khi phát thông báo cho `Reminder`, `Asset`, `Subscription`, backend truyền `channels=to_delivery_channels(item.notification_channels)` trực tiếp sang `NotificationService.notify(...)` (gửi đúng `WEBSITE` [`IN_APP`+`PUSH`], `TELEGRAM`, `EMAIL`; nếu bỏ `WEBSITE` sẽ đặt `expires_at=now` để không treo trên chuông web).
- **Trợ lý AI 1 luồng & Slash Commands**: `GET/DELETE /api/v1/workspace/assistant/thread` (1 luồng Web duy nhất), `GET /api/v1/workspace/assistant/bot-profile` (chỉ đọc Avatar/Tên/Model cho nút tròn Portal), `POST /api/v1/workspace/assistant/chat` hỗ trợ 6 lệnh Slash 0-token chuẩn tiếng Việt (`/hom_nay`, `/sap_toi`, `/chi_tieu`, `/thiet_bi`, `/nhac_viec`, `/tro_giup` kèm alias tiếng Anh `/today`, `/upcoming`, `/spending`, `/assets`, `/remind`, `/help`) và suy luận LLM đa model fallback qua `XKIRO_API_BASE` (`timeout <= 5s`/turn, deadline 20s, Redis model cooldown 120s khi lỗi 5xx/429). Chốt an toàn tầng lõi ở `AssistantService` luôn cấm khủng bố, quân sự, phân biệt vùng miền và cô lập Két sắt.
- **Telegram hai chiều**: `WorkspaceConfig.ready()` đăng ký handler vào `ModuleRegistry` để nhận update từ webhook `system` (hỗ trợ `/xac_minh` / `/verify_owner` xác minh chính chủ qua DM và 6 lệnh tương tác), kiểm tra chính sách AI & nhóm toàn cục từ `AssistantConfigService`, đẩy xử lý nền 1-hop qua QStash tới `POST /api/v1/workspace/assistant/telegram-process`.

## Sự kiện thông báo

Khai báo trong `app/workspace/module.py` (`scope="PERSONAL"`, `audience="OWNER"`):

- `workspace.reminder.due`
- `workspace.digest.daily`
- `workspace.warranty.expiring`
- `workspace.subscription.renewing`

## Frontend Routes (`/ca-nhan/...`, `/quan-tri/...`)

- **Nút tròn Chatbot AI kéo-thả toàn Portal (`AssistantFloatingWidget`)**: render vòng tròn Avatar/Bot kéo thả bằng Pointer Events và **tự hít sát cạnh gần nhất trong 4 cạnh màn hình** khi thả (lưu tọa độ tại `localStorage["assistant_launcher_position"]`), hỗ trợ 3 mức kích thước popup (`compact`/`default`/`large`, lưu tại `localStorage["assistant_popup_size"]`). Bấm để bật/tắt popup chat 1 luồng dùng chuẩn `Message` / `MessageScroller`, thanh lệnh nhanh + gợi ý `/` hiển thị badge trường trộn thân thiện (`Hôm nay`, `Sắp tới`, `Chi tiêu`, `Thiết bị`, `Nhắc việc`, `Trợ giúp`), ẩn nhãn model/token kỹ thuật, và hiện hiệu ứng `{Tên Bot} đang suy nghĩ` khi chờ AI. Người dùng Portal không có quyền sửa cấu hình Bot.
- `/ca-nhan/thiet-bi` (`.../tao-moi`, `.../[id]?tab=claims`, kèm chọn kênh thông báo) · deep-link `/ca-nhan/bao-hanh`
- `/ca-nhan/dich-vu` (`.../tao-moi`, `.../[id]?tab=payments`, kèm chọn kênh thông báo) · deep-link `/ca-nhan/gia-han`
- `/ca-nhan/ket-sat` (`.../tao-moi`, `.../[id]`)
- `/ca-nhan/nhac-viec` (`.../tao-moi`, `.../[id]`, dùng `DateTimePicker` gọn trong 1 khung cho Ngày & giờ đến hạn, `TagsInput` có tooltip `!`, kèm chọn kênh thông báo)
- `/ca-nhan/cai-dat`: Cài đặt cá nhân bố cục 2 cột (Múi giờ mặc định `(UTC+07:00) Asia/Ho_Chi_Minh`, Switch bật Daily Digest, `ChipListInput` cho khung giờ gửi & mốc ngày cảnh báo, nơi nhận Telegram cho phép và nút Hủy/Quay lại).
- `/quan-tri/he-thong/tro-ly-ai` (`en`: `/admin/system/assistant`): Trang quản trị Chatbot AI chuẩn `FormPage` + `FormLayout` trong menu `Hệ thống` (cấu hình Avatar/Tên/Policy/Model/Telegram Bot kèm danh sách lệnh, khối copy `@BotFather /setcommands` và nút Hủy/Quay lại).
