"""Mặc định của module Tài chính."""

# Báo cáo, mốc thuế, tỷ giá đều theo ngày giờ Việt Nam.
FINANCE_TIMEZONE = "Asia/Ho_Chi_Minh"
# Webhook SePay: lệch giờ tối đa giữa X-SePay-Timestamp và server (chống replay).
SEPAY_WEBHOOK_TOLERANCE_SECONDS = 300
# Salt dẫn xuất secret webhook từ DJANGO_SECRET_KEY (salted_hmac), và mục đích mã hóa token API.
SEPAY_WEBHOOK_SECRET_SALT = "finance.sepay.webhook"  # noqa: S105 - mã/nhãn, không phải bí mật
SEPAY_TOKEN_PURPOSE = "finance.sepay.token"  # noqa: S105 - mã/nhãn, không phải bí mật
# Lấy thủ công: khoảng ngày tối đa mỗi lần.
SEPAY_IMPORT_MAX_DAYS = 92
# Regex quy tắc: thời gian tối đa mỗi lần so (giây).
RULE_REGEX_TIMEOUT_SECONDS = 0.05
# Tối đa ký tự hiển thị nội dung trong thông báo.
NOTIFICATION_CONTENT_MAX = 120
TOKEN_TAIL = 4
PERCENT = 100
