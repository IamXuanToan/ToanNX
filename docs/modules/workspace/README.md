# Module Workspace (`workspace`)

Trợ lý cá nhân toàn diện trong Client Portal (`/ca-nhan` · `/en/portal`) và Quản trị Chatbot AI & Lịch bản tin dùng chung trong Admin (`/quan-tri/he-thong/tro-ly-ai`): theo dõi Thiết bị & Bảo hành/Sửa chữa, Dịch vụ định kỳ & Lịch sử thanh toán gia hạn, Két sắt bí mật mã hóa AES-256, Nhắc việc cá nhân (kèm mốc ngày nhắc trước), Lịch tổng hợp 6 nguồn (kèm Tiền vào & Donate), Bản tin Digest tự động (mọi kênh thông báo Website/Telegram/Email cấu hình tập trung tại **Hồ sơ → Thông báo**) và Chatbot AI 1 luồng Web + Telegram (OpenAI-compatible `xKiro`).

- BE: `backend/app/workspace/` · FE: `frontend/src/modules/workspace/`
- URL Portal: `/ca-nhan/...`, `/en/portal/...`
- URL Admin: `/quan-tri/he-thong/tro-ly-ai`, `/en/admin/system/assistant` (gắn chung trong menu Hệ thống → Vận hành, dùng chuẩn `FormPage`/`FormLayout` như các danh mục Hệ thống)
- Phụ thuộc: `system`, `finance`, `utilities`, `novel`.

## Model (9 models)

| Model                   | Mục đích & điểm chính                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Asset`                 | Thiết bị cá nhân: định danh (`brand`, `model_code`, `serial_number`, `imei`, `specs`), giá mua quy đổi VNĐ chặt chẽ theo `WorkspaceExchangeService` (ngoại tệ thiếu tỷ giá → `400 WORKSPACE_CURRENCY_RATE_REQUIRED`), hóa đơn/chứng từ **riêng tư** (`M2M Attachment`), tính `warranty_end_date` (kẹp cuối tháng `add_months_clamped`). Có `JournalTracker`.                 |
| `AssetWarrantyClaim`    | Phiếu bảo hành / sửa chữa gắn `Asset` (`WARRANTY`, `PAID_REPAIR`, `MAINTENANCE`), trạng thái, trung tâm bảo hành, ngày hẹn/nhận trả, chi phí quy đổi VNĐ, tệp biên nhận riêng tư (`M2M Attachment`). Có `JournalTracker`.                                                                                                                                                                                                                                 |
| `Subscription`          | Dịch vụ định kỳ (`WEEKLY`, `MONTHLY`, `QUARTERLY`, `SEMI_ANNUAL`, `YEARLY`, `CUSTOM_DAYS` + `anchor_day`), tiền tệ + tỷ giá quy đổi VNĐ, `renew_date`, `reminder_days_before`. Có `JournalTracker`.                                                                                                                                                                         |
| `SubscriptionPayment`   | Lịch sử thanh toán gia hạn nguyên tử sinh từ `POST /subscriptions/{id}/renew` (có `period_from`..`period_to`, lấy tỷ giá tại ngày `paid_on`, gắn biên lai riêng tư `receipt_attachment`). Có `JournalTracker`.                                                                                                                                                                                                                                               |
| `VaultItem`             | Két sắt bí mật: trường `secret_encrypted` mã hóa qua `SecretCipher` (purpose `"workspace.vault.secret"`), `secret_last4`, `tags`. API đọc (`list`/`retrieve`/AI tools) **không bao giờ** trả `secret`; giải mã tách riêng ở `POST /vault-items/{id}/reveal` (quyền `workspace.vault_item.reveal`, ghi audit `JournalTracker`). Có `JournalTracker`.                                                                                                          |
| `Reminder`              | Nhắc việc cá nhân (`due_date`, `due_time`, `notify_minutes_before`, `reminder_days_before` chọn nhiều ngày/mẫu nhắc trước, `priority`, `is_completed`, `recurrence`, `topic`). Hoàn thành nhắc việc lặp sẽ tự sinh nhắc việc kỳ kế tiếp. Có `JournalTracker`. |
| `ReminderTopic`         | Chủ đề phân loại nhắc việc (`code`, `name`, `color`, `sort_order`, `is_system`). Seed 7 chủ đề mặc định hệ thống (`owner=None`, `is_system=True`: Công việc, Ngày kỷ niệm, Ngày giỗ, Gia đình, Sinh nhật, Sức khỏe, Tài chính) dùng chung và cho phép user CRUD chủ đề cá nhân qua Dialog trực tiếp trên form Nhắc việc (không thêm menu sidebar). Có `JournalTracker`. |
| `AssistantConversation` | Luồng chat Trợ lý AI: Web dùng **đúng 1 luồng duy nhất** mỗi user (`channel="WEB"`), Telegram lưu theo `external_chat_id` (`TELEGRAM_DM`, `TELEGRAM_GROUP`). Lưu hành động chờ (`pending_action`, `pending_expires_at`: nháp tạo mới / xóa 2 bước, TTL 10 phút).                                                                                                                                                                                                                                                                                                 |
| `AssistantKnowledgeChunk` | Đoạn tri thức RAG chung (không theo user) mô tả chức năng Client Portal: `source`, `heading`, `content`, `content_hash`, `embedding` `halfvec(768)` (Gemini), `embedding_model`. Tự đồng bộ sau mỗi `migrate` (hook `post_migrate`, DB test không gọi Gemini), thêm lệnh/task `sync_assistant_knowledge`. Nguồn: file `.md`, metadata model của tool và registry tool chung `ASSISTANT_RECORD_RESOURCES`. |
| `AssistantMessage`      | Tin nhắn trong luồng chat (`USER`/`ASSISTANT`/`TOOL`/`SYSTEM`, lưu `sender_telegram_id`, `tool_calls`, `model_used`, `tokens_used`, `contains_private_data`, `metadata` chứa `quick_replies`/`cards`).                                                                                                                                                                                                                                                                                                |

> Cấu hình Chatbot AI & Lịch bản tin dùng chung toàn hệ thống (Avatar công khai `assistant_avatar_id`, Tên `assistant_name`, Kích thước nút tròn nổi `launcher_size` `sm`/`md`/`lg`, Policy `assistant_system_prompt`, Model ưu tiên, Giới hạn token ngày, Quy tắc Bot Telegram nhóm/DM, Khung giờ gửi bản tin `digest_time_slots`, Mục hiển thị `digest_sections`, Mốc bảo hành/gia hạn mặc định) lưu tập trung tại `system.Setting` (`SettingKey.WORKSPACE_ASSISTANT_CONFIG`), sử dụng múi giờ hệ thống `UTC+7` (`Asia/Ho_Chi_Minh`), được data migration `0004_seed_assistant_default_policy` khởi tạo sẵn Policy an toàn chuẩn (cấm khủng bố, quân sự, phân biệt vùng miền & bảo mật Két sắt), chỉ Admin cấu hình qua `/api/v1/workspace/assistant/config`.

## Quyền (10 nhóm quyền)

Mọi quyền tài nguyên cá nhân đều có `MEMBER` và `MANAGE_ALL`; `AssistantConfigPermission` **không** thuộc `MEMBER` (chỉ Admin):

| Class                          | Tài nguyên             | `MEMBER`                                 |
| ------------------------------ | ---------------------- | ---------------------------------------- |
| `AssetPermission`              | `asset`                | read, create, update, delete             |
| `AssetWarrantyClaimPermission` | `warranty_claim`       | read, create, update, delete             |
| `SubscriptionPermission`       | `subscription`         | read, create, update, delete             |
| `SubscriptionPaymentPermission`| `subscription_payment` | read, delete                             |
| `VaultItemPermission`          | `vault_item`           | read, create, update, delete, **reveal** |
| `ReminderPermission`           | `reminder`             | read, create, update, delete             |
| `ReminderTopicPermission`      | `reminder_topic`       | read, create, update, delete             |
| `AssistantPermission`          | `assistant`            | chat                                     |
| `AssistantConfigPermission`    | `assistant_config`     | _(Chỉ Admin: read, update)_              |
| `WorkspaceDashboardPermission` | `dashboard`            | read                                     |
| `WorkspaceCalendarPermission`  | `calendar`             | read                                     |

> Lưu ý: Mọi tool của Trợ lý AI khi truy cập dữ liệu cá nhân luôn ép `owner_id=actor.pk` ngay cả khi người dùng có `*.manage_all`, đồng thời loại trừ hoàn toàn `VaultItem`.

## Động cơ Cron Serverless & AI

- **Đường W4 (Cảnh báo & Digest DB)**: `POST /api/v1/workspace/cron/tick` kiểm tra mốc Redis `workspace:cron:alerts_next_due` (TTL Redis **24 giờ**, cleanup 03:00 UTC chạy `refresh_cron_schedules` (cùng `sync_assistant_knowledge` đồng bộ tri thức RAG, chỉ nhúng Gemini đoạn mới/đổi) để bảo đảm mỗi ngày luôn truy vấn DB kiểm tra và re-warm lại Redis/QStash kể cả khi Redis mất khóa). Khi đến hạn, QStash gọi `POST /api/v1/workspace/cron/dispatch-due` để quét Reminder, Bảo hành (`Asset`), Dịch vụ (`Subscription`) và Digest theo khung giờ địa phương, rồi gọi `NotificationService.notify(...)` tuân theo cấu hình kênh nhận từng sự kiện trong **Hồ sơ → Thông báo** (`NotificationPreference`).
- **Trợ lý AI 1 luồng & Slash Commands**: `GET/DELETE /api/v1/workspace/assistant/thread` (1 luồng Web duy nhất, tự lọc bỏ bản ghi `TOOL` và bước `tool_calls` nội bộ để không lộ JSON hay bong bóng rỗng), `GET /api/v1/workspace/assistant/bot-profile` (chỉ đọc Avatar/Tên/Kích thước nút tròn/Model cho nút tròn Portal), `POST /api/v1/workspace/assistant/chat` hỗ trợ 7 lệnh Slash 0-token chuẩn tiếng Việt (`/hom_nay`, `/sap_toi`, `/chi_tieu`, `/thiet_bi`, `/nhac_viec`, `/xoa_lich_su`, `/tro_giup` kèm alias tiếng Anh), bộ Agentic Tools toàn diện cho **chỉ Client Portal cá nhân** (Hồ sơ cá nhân, Liệt kê module, Thống kê toàn diện, Nhắc việc, Thu nhập & Dòng tiền `days`/khoảng ngày, Nền tảng tài chính, Thiết bị & Bảo hành, Dịch vụ định kỳ, Két sắt bí mật có kiểm quyền `vault_item.reveal` & ghi audit, Link rút gọn, Mã QR, Trang cá nhân; kiểm tra quyền RBAC thực tế, xác nhận 2 bước chống xóa nhầm qua `AssistantConfirmationService`, ép `owner_id=actor.pk`, tuyệt đối cấm truy cập Admin) và suy luận LLM đa model fallback qua `XKIRO_API_BASE` (`timeout <= 5s`/turn, deadline 20s, Redis model cooldown 120s khi lỗi 5xx/429). Chi tiết xem [Trợ lý AI & Chatbot Telegram hai chiều](../../features/assistant-ai.md).
- **Telegram hai chiều**: `WorkspaceConfig.ready()` đăng ký handler vào `ModuleRegistry` để nhận update từ webhook `system` (hỗ trợ `/xac_minh` / `/verify_owner` xác minh chính chủ qua DM và 7 lệnh tương tác), hỗ trợ 2 chế độ phản hồi từng nhóm trên `TelegramChat.group_reply_mode` (`mention_only` hoặc `all_messages` cho nhóm 2 người), kiểm tra chính sách AI & nhóm toàn cục từ `AssistantConfigService`, đẩy xử lý nền 1-hop qua QStash tới `POST /api/v1/workspace/assistant/telegram-process`.

## Sự kiện thông báo

Khai báo trong `app/workspace/module.py` (`scope="PERSONAL"`, `audience="OWNER"`):

- `workspace.reminder.due`
- `workspace.digest.daily`
- `workspace.warranty.expiring`
- `workspace.subscription.renewing`

## Frontend Routes (`/ca-nhan/...`, `/quan-tri/...`)

- **Nút tròn Chatbot AI kéo-thả toàn Portal (`AssistantFloatingWidget`)**: render vòng tròn Avatar/Bot kéo thả bằng Pointer Events và **tự hít sát cạnh gần nhất trong 4 cạnh màn hình** khi thả (lưu tọa độ tại `localStorage["assistant_launcher_position"]`), kích thước nút tròn (`sm` 40px / `md` 48px / `lg` 60px) đồng bộ từ cấu hình Admin `launcher_size`. Bấm để bật/tắt popup chat 1 luồng (cỡ cố định `420x560` tự co theo khung nhìn) dùng chuẩn `Message` / `MessageScroller`, tin nhắn Trợ lý hợp lệ được render Markdown qua `MarkdownContent` (tiêu đề, in đậm/nghiêng, danh sách, code block, bảng GFM, link an toàn qua `toSafeHttpUrl`), header gọn gồm `[🗑 Xóa lịch sử]` (hộp xác nhận) và `[×]`, chân khung giữ thanh lệnh nhanh + gợi ý `/` (gồm `/xoa_lich_su` / `/clear`) hiển thị badge trường trộn thân thiện, mọi tooltip dùng `AppTooltip`, ẩn nhãn model/token kỹ thuật, và hiện hiệu ứng `{Tên Bot} đang suy nghĩ` khi chờ AI. Người dùng Portal không có quyền sửa cấu hình Bot.
- `/ca-nhan/thiet-bi` (`.../tao-moi`, `.../[id]?tab=claims`) · deep-link `/ca-nhan/bao-hanh`
- `/ca-nhan/dich-vu` (`.../tao-moi`, `.../[id]?tab=payments`) · deep-link `/ca-nhan/gia-han`
- `/ca-nhan/ket-sat` (`.../tao-moi`, `.../[id]`)
- `/ca-nhan/nhac-viec` (`.../tao-moi`, `.../[id]`, dùng `DateTimePicker` gọn trong 1 khung cho Ngày & giờ đến hạn, `ChipListInput` có option mẫu chọn nhiều ngày nhắc trước, `TagsInput` có tooltip `!`)
- `/ca-nhan` (`PortalCalendar`): Lịch tổng hợp 6 nguồn (Dịch vụ định kỳ, Nhắc việc, Bảo hành thiết bị, Hẹn trả sửa chữa, **Tiền vào** và **Donate**), hiển thị trực tiếp các pill sự kiện/tiền vào/donate ngay trên từng ô ngày.
- `/quan-tri/he-thong/tro-ly-ai` (`en`: `/admin/system/assistant`): Trang quản trị Chatbot AI & Lịch bản tin chuẩn `FormPage` + `FormLayout` trong menu `Hệ thống` (cấu hình Avatar/Tên/Kích thước nút tròn/Policy/Model/Telegram Bot, khung giờ & mục Digest toàn hệ thống, mốc cảnh báo mặc định, danh sách lệnh, khối copy `@BotFather /setcommands` và nút Hủy/Quay lại). Bật/tắt nhận bản tin của từng người dùng nằm ở Hồ sơ → Thông báo (`workspace.digest.daily`).
