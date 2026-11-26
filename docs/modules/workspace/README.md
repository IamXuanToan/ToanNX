# Module Workspace (`workspace`)

Trợ lý cá nhân toàn diện trong Client Portal (`/ca-nhan` · `/en/portal`): theo dõi Thiết bị & Bảo hành/Sửa chữa, Dịch vụ định kỳ & Lịch sử thanh toán gia hạn, Két sắt bí mật mã hóa AES-256, Giám sát Uptime/HTTP & Sự cố, Nhắc việc cá nhân, Lịch tổng hợp 5 nguồn, Bản tin Digest tự động và Trợ lý AI hai chiều qua Web & Telegram (OpenAI-compatible `xKiro`).

- BE: `backend/app/workspace/` · FE: `frontend/src/modules/workspace/`
- URL: 100% Client Portal (`/ca-nhan/...`, `/en/portal/...`); **không** có menu trong Admin `/quan-tri`.
- Phụ thuộc: `system`, `finance`, `utilities`, `novel`.

## Model (11 models)

| Model | Mục đích & điểm chính |
| --- | --- |
| `Asset` | Thiết bị cá nhân: định danh (`brand`, `model_code`, `serial_number`, `imei`, `specs`), giá mua quy đổi VNĐ chặt chẽ theo `WorkspaceExchangeService` (ngoại tệ thiếu tỷ giá → `400 WORKSPACE_CURRENCY_RATE_REQUIRED`), hóa đơn/chứng từ **riêng tư** (`M2M Attachment`), tính `warranty_end_date` (kẹp cuối tháng `add_months_clamped`), bộ đếm `warranty_claim_count`/`repair_count`/`total_claim_count`/`open_claim_count`/`total_service_cost_vnd`. Có `JournalTracker`. |
| `AssetWarrantyClaim` | Phiếu bảo hành / sửa chữa gắn `Asset` (`WARRANTY`, `PAID_REPAIR`, `MAINTENANCE`), trạng thái, trung tâm bảo hành, ngày hẹn/nhận trả, chi phí quy đổi VNĐ, bảo hành linh kiện thay thế, tệp biên nhận riêng tư (`M2M Attachment`). Có `JournalTracker`. |
| `Subscription` | Dịch vụ định kỳ (`WEEKLY`, `MONTHLY`, `QUARTERLY`, `SEMI_ANNUAL`, `YEARLY`, `CUSTOM_DAYS` + `anchor_day`), tiền tệ + tỷ giá quy đổi VNĐ, `renew_date`, `reminder_days_before`. Có `JournalTracker`. |
| `SubscriptionPayment` | Lịch sử thanh toán gia hạn nguyên tử sinh từ `POST /subscriptions/{id}/renew` (có `period_from`..`period_to`, lấy tỷ giá tại ngày `paid_on`, gắn biên lai riêng tư `receipt_attachment`). Có `JournalTracker`. |
| `VaultItem` | Két sắt bí mật: trường `secret_encrypted` mã hóa qua `SecretCipher` (purpose `"workspace.vault"`), `secret_last4`, `tags`. API đọc (`list`/`retrieve`/AI tools) **không bao giờ** trả `secret`; giải mã tách riêng ở `POST /vault-items/{id}/reveal` (quyền `workspace.vault_item.reveal`, ghi audit `JournalTracker`). Có `JournalTracker`. |
| `MonitorTarget` | Endpoint giám sát Uptime/HTTP (`url` kiểm tra SSRF 7 lớp bằng `SafeHttpClient`, `method` `GET`/`HEAD`, `expected_status`, `timeout_seconds` `1..4`, `check_interval_minutes >= 15`, `is_active`). Trạng thái nóng được trộn từ Redis. Có `JournalTracker`. |
| `MonitorIncident` | Sự cố gián đoạn tự mở khi `HEALTHY/UNKNOWN -> DOWN` và đóng kèm `duration_seconds` khi `DOWN -> HEALTHY`. Có `JournalTracker`. |
| `Reminder` | Nhắc việc cá nhân (`due_date`, `due_time`, `notify_minutes_before`, `priority`, `is_completed`, `recurrence`, `anchor_day`, `tags`). Hoàn thành nhắc việc lặp sẽ tự sinh nhắc việc kỳ kế tiếp. Có `JournalTracker`. |
| `WorkspaceSetting` | Cấu hình cá nhân (unique theo `owner` khi `deleted_at IS NULL`): `timezone`, `daily_digest_enabled`, `digest_time_slots`, `digest_sections`, `warranty_alert_days`, `subscription_default_alert_days`, `preferred_ai_model`, `ai_daily_token_limit`, `telegram_ai_enabled`, `telegram_allowed_chat_ids`, `telegram_group_require_mention`, `telegram_group_tool_policy` (`DISABLED`/`OWNER_ONLY`/`ALL_MEMBERS`), `telegram_group_hide_amounts`, `telegram_group_reply_in_dm`. Có `JournalTracker`. |
| `AssistantConversation` | Hội thoại Trợ lý AI đa kênh (`WEB`, `TELEGRAM_DM`, `TELEGRAM_GROUP`), lưu `external_chat_id` và thống kê `message_count`. |
| `AssistantMessage` | Tin nhắn trong hội thoại (`USER`/`ASSISTANT`/`TOOL`/`SYSTEM`, lưu `sender_telegram_id`, `tool_calls`, `model_used`, `tokens_used`, `contains_private_data`). |

## Quyền (13 nhóm quyền)

Mọi quyền đều có `MEMBER` (thành viên thường được gán qua `WORKSPACE_MEMBER`) và `MANAGE_ALL` cho `ADMIN`:

| Class | Tài nguyên | `MEMBER` |
| --- | --- | --- |
| `AssetPermission` | `asset` | read, create, update, delete |
| `AssetWarrantyClaimPermission` | `warranty_claim` | read, create, update, delete |
| `SubscriptionPermission` | `subscription` | read, create, update, delete |
| `SubscriptionPaymentPermission` | `subscription_payment` | read, delete |
| `VaultItemPermission` | `vault_item` | read, create, update, delete, **reveal** |
| `MonitorTargetPermission` | `monitor_target` | read, create, update, delete |
| `MonitorIncidentPermission` | `monitor_incident` | read, delete |
| `ReminderPermission` | `reminder` | read, create, update, delete |
| `WorkspaceSettingPermission` | `workspace_setting` | read, update |
| `AssistantConversationPermission` | `assistant_conversation` | read, delete |
| `AssistantPermission` | `assistant` | chat |
| `WorkspaceDashboardPermission` | `dashboard` | read |
| `WorkspaceCalendarPermission` | `calendar` | read |

> Lưu ý: Mọi tool của Trợ lý AI khi truy cập dữ liệu cá nhân luôn ép `owner_id=actor.pk` ngay cả khi người dùng có `*.manage_all`, đồng thời loại trừ hoàn toàn `VaultItem`.

## Động cơ Cron Serverless & AI

- **Đường W1 (Monitor Uptime — Redis-only khi ổn định)**: `POST /api/v1/workspace/cron/tick` dùng lock Redis atomic `workspace:lock:w1` (`CacheService.set_if_absent`). Đọc `workspace:monitors:active`, ping song song qua `SafeHttpClient`, ghi kết quả vào `workspace:monitor_state:{id}`. Chỉ chạm DB khi flip trạng thái (`HEALTHY <-> DOWN`), cache miss (re-warm từ DB), hoặc flush định kỳ mỗi 6 giờ.
- **Đường W4 (Cảnh báo & Digest DB)**: `POST /api/v1/workspace/cron/tick` kiểm tra mốc Redis `workspace:alerts_next_due` trước khi mở kết nối DB; khi hệ thống rảnh (không có nhắc việc/cảnh báo trong cửa sổ lookahead `90 ngày` và không bật digest), đặt mốc tới **`+7 ngày`** và **không tự publish QStash lặp mỗi 24 giờ**. Khi đến hạn, QStash gọi `POST /api/v1/workspace/cron/dispatch-due` (trừ khi Redis đã có mốc `alerts_next_due` ở tương lai `> now + 2s` thì bỏ qua 0 SQL) để quét Reminder tới hạn, Bảo hành (`Asset`), Dịch vụ (`Subscription`) sắp gia hạn và Digest theo khung giờ địa phương của từng người; ghi khóa Redis đánh dấu đã gửi reminder/alert để tránh lặp W4 mỗi 15 phút, dùng `NotificationService.notify(..., kick=False)` và gọi đúng 1 lần `flush_kick()` cuối lượt.
- **Trợ lý AI xKiro & Slash Commands**: hỗ trợ 8 lệnh Slash 0-token (`/today`, `/upcoming`, `/spending`, `/assets`, `/status`, `/remind`, `/newchat`, `/help`) và suy luận LLM đa model fallback qua `XKIRO_API_BASE` (`timeout <= 5s`/turn, deadline 20s, Redis model cooldown 120s khi lỗi 5xx/429).
- **Telegram hai chiều**: `WorkspaceConfig.ready()` đăng ký handler vào `ModuleRegistry` để nhận update từ webhook `system`, đẩy xử lý nền 1-hop qua QStash tới `POST /api/v1/workspace/assistant/telegram-process`, và hỗ trợ local polling `uv run python manage.py poll_telegram_assistant`.

## Sự kiện thông báo

Khai báo trong `app/workspace/module.py` (`scope="PERSONAL"`, `audience="OWNER"`):

- `workspace.reminder.due`
- `workspace.digest.daily`
- `workspace.warranty.expiring`
- `workspace.subscription.renewing`
- `workspace.monitor.down`
- `workspace.monitor.recovered`

## Frontend Routes (`/ca-nhan/...` · `/en/portal/...`)

- `/ca-nhan/thiet-bi` (`.../tao-moi`, `.../[id]`)
- `/ca-nhan/bao-hanh` (`.../tao-moi`, `.../[id]`)
- `/ca-nhan/dich-vu` (`.../tao-moi`, `.../[id]`)
- `/ca-nhan/gia-han`
- `/ca-nhan/ket-sat` (`.../tao-moi`, `.../[id]`)
- `/ca-nhan/uptime` (`.../tao-moi`, `.../[id]`)
- `/ca-nhan/su-co`
- `/ca-nhan/nhac-viec` (`.../tao-moi`, `.../[id]`)
- `/ca-nhan/tro-ly`
- `/ca-nhan/cai-dat`
