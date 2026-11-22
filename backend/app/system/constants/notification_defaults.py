"""Giới hạn và mặc định của hệ thống thông báo."""

# Outbox: số lần thử tối đa và khoảng lùi (phút) giữa các lần thử lỗi tạm.
NOTIFICATION_MAX_ATTEMPTS = 5
NOTIFICATION_RETRY_BACKOFF_MINUTES = (1, 5, 15, 60, 240)
# Ngân sách thời gian gửi ngay sau commit trong một request (giây) và cho một lần cron.
NOTIFICATION_CRON_BUDGET_SECONDS = 50
NOTIFICATION_CRON_BATCH = 200
# Thời gian chờ mỗi lần gọi dịch vụ ngoài (giây).
NOTIFICATION_PROVIDER_TIMEOUT_SECONDS = 3
# Phân trang chuông.
NOTIFICATION_PAGE_SIZE = 20
# Lô tạo thông báo hệ thống gửi nhiều người.
NOTIFICATION_BULK_BATCH = 500
# Giữ dữ liệu (ngày).
NOTIFICATION_READ_RETENTION_DAYS = 90
NOTIFICATION_RETENTION_DAYS = 180
NOTIFICATION_DELIVERY_RETENTION_DAYS = 30
PUSH_DEVICE_STALE_DAYS = 60
# Thiết bị mới: chưa có phiên cùng trình duyệt + IP trong số ngày này.
NEW_DEVICE_LOOKBACK_DAYS = 30
# Cảnh báo dung lượng lưu trữ khi đã dùng từ phần trăm này.
STORAGE_WARNING_PERCENT = 90

TELEGRAM_TIMEOUT_SECONDS = 5
TELEGRAM_API_BASE = "https://api.telegram.org"
TELEGRAM_REGISTRATION_MINUTES = 10
TELEGRAM_MESSAGE_MAX_LENGTH = 4000
TELEGRAM_TOKEN_PURPOSE = "system.telegram.bot_token"  # noqa: S105 - mã/nhãn, không phải bí mật

FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
FCM_SEND_URL = "https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"
