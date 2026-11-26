"""Hằng số dùng chung cho Workspace: Redis keys, giới hạn Free-tier, AI xKiro, Policy & Slash Commands."""

from typing import TypedDict

SECRET_CIPHER_PURPOSE = "workspace.vault.secret"  # noqa: S105 - purpose code, không phải bí mật

# Khóa Redis (không tiền tố tên dự án)
REDIS_W4_LOCK_KEY = "workspace:cron:w4_lock"
REDIS_ALERTS_NEXT_DUE_KEY = "workspace:cron:alerts_next_due"
REDIS_DIGEST_SENT_KEY = "workspace:digest_sent:{owner_id}:{date_str}:{slot}"
REDIS_REMINDER_SENT_KEY = "workspace:rem_sent:{reminder_id}:{due_date}"
REDIS_ALERT_SENT_KEY = "workspace:alert_sent:{alert_key}"
REDIS_AI_COOLDOWN_KEY = "workspace:ai:model_cooldown:{model}"

CRON_LOCK_TTL_SECONDS = 30
ALERTS_NEXT_DUE_TTL_SECONDS = 86400
DIGEST_WINDOW_SECONDS = 1800
DIGEST_SENT_TTL_SECONDS = 36 * 3600
REMINDER_SENT_TTL_SECONDS = 7 * 86400
ALERT_SENT_TTL_SECONDS = 48 * 3600
REMINDER_BACKSTOP_WINDOW_SECONDS = 48 * 3600
DISPATCH_DUE_SKEW_SECONDS = 2
ALERT_LOOKAHEAD_WINDOW_DAYS = 90

# Ngân sách xử lý cron
CRON_BATCH_BUDGET_SECONDS = 20.0

# AI Assistant (xKiro Multi-Model Fallback)
AI_HISTORY_CONTEXT_LIMIT = 10
AI_TOOL_ITEM_LIMIT = 15
AI_MAX_TOOL_ROUNDS = 3
AI_MAX_MODEL_ATTEMPTS = 3
AI_MAX_TOKENS = 1200
AI_REQUEST_DEADLINE_SECONDS = 20.0
AI_MIN_REMAINING_FOR_FALLBACK_SECONDS = 2.5
AI_INITIAL_MESSAGES_LIMIT = 50
AI_MESSAGE_MAX_LENGTH = 2000

# Policy mặc định được seed sẵn qua migration và luôn kèm chốt an toàn lõi ở AssistantService
DEFAULT_ASSISTANT_SYSTEM_PROMPT = (
    "Nguyên tắc an toàn & nội dung bắt buộc:\n"
    "1. Tuyệt đối KHÔNG thảo luận, cổ súy, hướng dẫn hay bình luận về khủng bố, bạo lực cực đoan, "
    "chất nổ, vũ khí, chiến tranh, xung đột vũ trang, quân sự hoặc khí tài quốc phòng.\n"
    "2. Tuyệt đối KHÔNG phân biệt vùng miền, địa phương, sắc tộc, quốc tịch, tôn giáo, giới tính "
    "hay công kích cá nhân/tổ chức; luôn giữ thái độ trung lập, khách quan và tôn trọng lẫn nhau.\n"
    "3. Nếu người dùng đề cập chủ đề bị cấm hoặc trái pháp luật, từ chối ngắn gọn, lịch sự và "
    "chuyển hướng về tác vụ hợp lệ, không thuyết giáo.\n"
    "4. Bảo mật & trung thực dữ liệu: chỉ dùng số liệu thật từ công cụ được cấp; tuyệt đối không "
    "bịa đặt số liệu và không truy xuất hay suy đoán mật khẩu, API key, bí mật trong Két sắt.\n"
    "5. Phong cách trả lời: lịch sự, súc tích bằng tiếng Việt có dấu (hoặc tiếng Anh nếu người dùng "
    "hỏi bằng tiếng Anh), trình bày gạch đầu dòng rõ ràng, ưu tiên quy đổi tiền tệ sang VNĐ."
)

# Lịch & Dọn dẹp
MAX_CALENDAR_RANGE_DAYS = 93
STALE_PROJECT_DAYS = 14
ASSISTANT_HISTORY_RETENTION_DAYS = 180

DEFAULT_REMINDER_DAYS_BEFORE = [7, 3, 1]
DEFAULT_WARRANTY_ALERT_DAYS = [30, 7, 1]
DEFAULT_DIGEST_TIME_SLOTS = ["08:00"]
DEFAULT_DIGEST_SECTIONS = ["reminders", "warranty", "subscriptions", "finance"]
ALLOWED_DIGEST_SECTIONS = frozenset(DEFAULT_DIGEST_SECTIONS)
DEFAULT_WORKSPACE_NOTIFICATION_CHANNELS = ("WEBSITE",)
ALLOWED_CALENDAR_TYPES = frozenset({"subscription", "reminder", "asset_warranty", "warranty_claim"})


class AssistantCommandSpec(TypedDict):
    """Định nghĩa chuẩn cho từng câu lệnh Trợ lý AI dùng chung Web & Telegram @BotFather."""

    canonical: str
    command: str
    en_command: str
    syntax: str
    en_syntax: str
    description: str
    en_description: str
    telegram_only: bool


ASSISTANT_COMMANDS: tuple[AssistantCommandSpec, ...] = (
    {
        "canonical": "today",
        "command": "/hom_nay",
        "en_command": "/today",
        "syntax": "/hom_nay",
        "en_syntax": "/today",
        "description": "Xem việc cần làm & nhắc hẹn hôm nay",
        "en_description": "View today's tasks & reminders",
        "telegram_only": False,
    },
    {
        "canonical": "upcoming",
        "command": "/sap_toi",
        "en_command": "/upcoming",
        "syntax": "/sap_toi [số_ngày]",
        "en_syntax": "/upcoming [days]",
        "description": "Xem dịch vụ định kỳ sắp đến hạn gia hạn",
        "en_description": "Check upcoming service renewals",
        "telegram_only": False,
    },
    {
        "canonical": "spending",
        "command": "/chi_tieu",
        "en_command": "/spending",
        "syntax": "/chi_tieu [mm/yyyy]",
        "en_syntax": "/spending [mm/yyyy]",
        "description": "Tổng hợp chi tiêu cá nhân trong tháng",
        "en_description": "Monthly personal spending summary",
        "telegram_only": False,
    },
    {
        "canonical": "assets",
        "command": "/thiet_bi",
        "en_command": "/assets",
        "syntax": "/thiet_bi [từ_khóa]",
        "en_syntax": "/assets [keyword]",
        "description": "Tra cứu thiết bị & hạn bảo hành",
        "en_description": "Look up assets & warranties",
        "telegram_only": False,
    },
    {
        "canonical": "remind",
        "command": "/nhac_viec",
        "en_command": "/remind",
        "syntax": "/nhac_viec <DD/MM> <HH:MM> <nội_dung>",
        "en_syntax": "/remind <DD/MM> <HH:MM> <title>",
        "description": "Tạo nhắc việc nhanh theo ngày giờ",
        "en_description": "Quickly create a reminder",
        "telegram_only": False,
    },
    {
        "canonical": "help",
        "command": "/tro_giup",
        "en_command": "/help",
        "syntax": "/tro_giup",
        "en_syntax": "/help",
        "description": "Xem danh sách & hướng dẫn câu lệnh nhanh",
        "en_description": "Show available quick commands",
        "telegram_only": False,
    },
    {
        "canonical": "verify_owner",
        "command": "/xac_minh",
        "en_command": "/verify_owner",
        "syntax": "/xac_minh",
        "en_syntax": "/verify_owner",
        "description": "Xác minh Telegram ID chính chủ (chat riêng với Bot)",
        "en_description": "Verify owner Telegram ID (DM only)",
        "telegram_only": True,
    },
)

SLASH_COMMAND_NAMES = tuple(item["command"] for item in ASSISTANT_COMMANDS if not item["telegram_only"])

SLASH_COMMAND_ALIASES: dict[str, str] = {
    "/hom_nay": "today",
    "/homnay": "today",
    "/today": "today",
    "/sap_toi": "upcoming",
    "/saptoi": "upcoming",
    "/upcoming": "upcoming",
    "/chi_tieu": "spending",
    "/chitieu": "spending",
    "/spending": "spending",
    "/thiet_bi": "assets",
    "/thietbi": "assets",
    "/assets": "assets",
    "/nhac_viec": "remind",
    "/nhacviec": "remind",
    "/remind": "remind",
    "/tro_giup": "help",
    "/trogiup": "help",
    "/help": "help",
    "/xac_minh": "verify_owner",
    "/xacminh": "verify_owner",
    "/verify_owner": "verify_owner",
}
