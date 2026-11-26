"""Hằng số dùng chung cho Workspace: Redis keys, giới hạn Free-tier, AI xKiro & Digest."""

SECRET_CIPHER_PURPOSE = "workspace.vault.secret"  # noqa: S105 - purpose code, không phải bí mật

# Khóa Redis (không tiền tố tên dự án)
REDIS_W1_LOCK_KEY = "workspace:cron:w1_lock"
REDIS_W4_LOCK_KEY = "workspace:cron:w4_lock"
REDIS_MONITORS_ACTIVE_KEY = "workspace:monitors:active"
REDIS_MONITOR_STATE_KEY = "workspace:monitor_state:{target_id}"
REDIS_ALERTS_NEXT_DUE_KEY = "workspace:cron:alerts_next_due"
REDIS_DIGEST_SENT_KEY = "workspace:digest_sent:{owner_id}:{date_str}:{slot}"
REDIS_REMINDER_SENT_KEY = "workspace:rem_sent:{reminder_id}:{due_date}"
REDIS_ALERT_SENT_KEY = "workspace:alert_sent:{alert_key}"
REDIS_AI_COOLDOWN_KEY = "workspace:ai:model_cooldown:{model}"

CRON_LOCK_TTL_SECONDS = 30
MONITORS_CACHE_TTL_SECONDS = 86400
MONITOR_STATE_TTL_SECONDS = 86400
ALERTS_NEXT_DUE_TTL_SECONDS = 7 * 86400
DIGEST_SENT_TTL_SECONDS = 36 * 3600
REMINDER_SENT_TTL_SECONDS = 7 * 86400
ALERT_SENT_TTL_SECONDS = 48 * 3600
REMINDER_BACKSTOP_WINDOW_SECONDS = 48 * 3600
DISPATCH_DUE_SKEW_SECONDS = 2
ALERT_LOOKAHEAD_WINDOW_DAYS = 90

# Ngân sách xử lý cron & ping song song
CRON_BATCH_BUDGET_SECONDS = 20.0
MONITOR_BATCH_FLUSH_HOURS = 6
MONITOR_MAX_WORKERS = 10
MONITOR_MAX_TIMEOUT_SECONDS = 5
MONITOR_MIN_INTERVAL_MINUTES = 15

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

# Lịch & Dọn dẹp
MAX_CALENDAR_RANGE_DAYS = 93
STALE_PROJECT_DAYS = 14
MONITOR_INCIDENT_RETENTION_DAYS = 90
ASSISTANT_HISTORY_RETENTION_DAYS = 180

DEFAULT_REMINDER_DAYS_BEFORE = [7, 3, 1]
DEFAULT_WARRANTY_ALERT_DAYS = [30, 7, 1]
DEFAULT_DIGEST_TIME_SLOTS = ["08:00"]
DEFAULT_DIGEST_SECTIONS = ["reminders", "warranty", "subscriptions", "monitors", "finance"]
ALLOWED_DIGEST_SECTIONS = frozenset(DEFAULT_DIGEST_SECTIONS)
ALLOWED_CALENDAR_TYPES = frozenset(
    {"subscription", "reminder", "asset_warranty", "warranty_claim", "monitor_incident"}
)
SLASH_COMMAND_NAMES = (
    "/today",
    "/upcoming",
    "/spending",
    "/assets",
    "/status",
    "/remind",
    "/newchat",
    "/help",
)
