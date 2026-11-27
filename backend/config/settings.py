"""Cấu hình Django của ToanNX.

Một file cấu hình duy nhất; local và production chỉ khác nhau ở biến môi trường
(DJANGO_DEBUG, DATABASE_URL, DJANGO_SECRET_KEY...). Không hardcode secrets.
"""

from enum import StrEnum
from pathlib import Path
from typing import Any

import environ
from corsheaders.defaults import default_headers

from app.core.constants.core_rate_limit_key import CoreRateLimitKey
from app.finance.constants.finance_rate_limit_key import FinanceRateLimitKey
from app.novel.constants.novel_rate_limit_key import NovelRateLimitKey
from app.system.constants.media_types import ALLOWED_CONTENT_TYPES
from app.system.constants.system_rate_limit_key import SystemRateLimitKey
from app.utilities.constants.utilities_rate_limit_key import UtilitiesRateLimitKey
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
# Máy local có `.env.local` (DB local, không R2) → chỉ đọc file đó; server production không có file này
# → đọc `.env`. Không gộp hai file: biến thiếu trong `.env.local` không âm thầm lấy giá trị production.
# Biến đã có sẵn trong môi trường (Vercel, CI, Playwright) luôn thắng file.
_LOCAL_ENV_FILE = BASE_DIR / ".env.local"
environ.Env.read_env(_LOCAL_ENV_FILE if _LOCAL_ENV_FILE.exists() else BASE_DIR / ".env", overwrite=False)

# Secret dùng chung cho toàn hệ thống: session/CSRF của Django, ký access JWT, HMAC refresh token.
# Đổi giá trị này sẽ vô hiệu mọi phiên đăng nhập.
SECRET_KEY = env.str("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS: list[str] = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
    "django.contrib.postgres",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "django_filters",
    "app.system",
    "app.novel",
    "app.utilities",
    "app.finance",
    "app.workspace",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "app.core.middleware.request_context_middleware.RequestContextMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
APPEND_SLASH = False

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": ["django.template.context_processors.request"]},
    },
]

# Database. Test do pytest-django tạo DB riêng `test_toannx`, không đụng DB thật.
_STATEMENT_TIMEOUT_MS = env.int("DB_STATEMENT_TIMEOUT_MS", default=5000)
_DEFAULT_DB_CONFIG = env.db_url("DATABASE_URL")
_DEFAULT_DB_CONFIG.setdefault("OPTIONS", {})
_DEFAULT_DB_CONFIG["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=0)
_DEFAULT_DB_CONFIG["CONN_HEALTH_CHECKS"] = True
# Chờ kết nối tối đa N giây (Neon đang ngủ cần vài giây để thức; không chờ vô hạn khi mạng lỗi).
_DEFAULT_DB_CONFIG["OPTIONS"].setdefault("connect_timeout", env.int("DB_CONNECT_TIMEOUT", default=10))
_DEFAULT_DB_CONFIG["TEST"] = {"NAME": "test_toannx"}
if "DB_NAME" in env:
    _DEFAULT_DB_CONFIG["NAME"] = env.str("DB_NAME")
if not _DEFAULT_DB_CONFIG.get("PORT"):
    _DEFAULT_DB_CONFIG["PORT"] = 5432
else:
    _DEFAULT_DB_CONFIG["PORT"] = int(_DEFAULT_DB_CONFIG["PORT"])

DATABASES = {
    "default": _DEFAULT_DB_CONFIG,
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Người dùng & mật khẩu
AUTH_USER_MODEL = "system.User"
AUTHENTICATION_BACKENDS = [
    "app.system.backends.account_auth_backend.AccountAuthBackend",
    "app.system.backends.iam_permission_backend.IamPermissionBackend",
]
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 10},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# File upload (module attachment).
# Local: lưu filesystem `media/`. Production (Vercel không có filesystem bền): cấu hình
# Cloudflare R2 Object Storage (Zero Egress fees) qua biến môi trường.
CLOUDFLARE_R2_ACCOUNT_ID = env.str("CLOUDFLARE_R2_ACCOUNT_ID", default="")
CLOUDFLARE_R2_ACCESS_KEY_ID = env.str("CLOUDFLARE_R2_ACCESS_KEY_ID", default="")
CLOUDFLARE_R2_SECRET_ACCESS_KEY = env.str("CLOUDFLARE_R2_SECRET_ACCESS_KEY", default="")
CLOUDFLARE_R2_BUCKET_NAME = env.str("CLOUDFLARE_R2_BUCKET_NAME", default="")
# Bucket R2 riêng KHÔNG bật public access cho file riêng tư (chứng từ...); chỉ mở qua link ký hạn ngắn.
CLOUDFLARE_R2_PRIVATE_BUCKET_NAME = env.str("CLOUDFLARE_R2_PRIVATE_BUCKET_NAME", default="")
CLOUDFLARE_R2_CUSTOM_DOMAIN = env.str("CLOUDFLARE_R2_CUSTOM_DOMAIN", default="")
CLOUDFLARE_R2_ENDPOINT_URL = env.str("CLOUDFLARE_R2_ENDPOINT_URL", default="")
# API Token Cloudflare (quyền: Account -> R2 Storage -> Read) để lấy dung lượng thực tế
# từ Cloudflare REST API v4
CLOUDFLARE_API_TOKEN = env.str("CLOUDFLARE_API_TOKEN", default="")

_configured_storage = env.str("FILE_STORAGE_BACKEND", default="")
_use_r2 = bool(
    _configured_storage == "app.core.storage.r2_storage.R2Storage"
    or (CLOUDFLARE_R2_BUCKET_NAME and _configured_storage != "django.core.files.storage.FileSystemStorage")
)

if not _configured_storage:
    _configured_storage = (
        "app.core.storage.r2_storage.R2Storage" if _use_r2 else "django.core.files.storage.FileSystemStorage"
    )

MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = (
    f"https://{CLOUDFLARE_R2_CUSTOM_DOMAIN.replace('https://', '').replace('http://', '').rstrip('/')}/"
    if (_use_r2 and CLOUDFLARE_R2_CUSTOM_DOMAIN)
    else "/media/"
)

# File riêng tư: bucket R2 riêng khi dùng R2; local lưu ngoài MEDIA_ROOT (không được phục vụ công khai).
# Dùng R2 mà chưa khai bucket riêng tư → upload riêng tư bị từ chối (không lặng lẽ lưu vào filesystem tạm).
PRIVATE_MEDIA_ROOT = BASE_DIR / "private_media"
_private_storage: dict[str, Any] = (
    {"BACKEND": "app.core.storage.r2_private_storage.R2PrivateStorage"}
    if (_use_r2 and CLOUDFLARE_R2_PRIVATE_BUCKET_NAME)
    else {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
        "OPTIONS": {"location": PRIVATE_MEDIA_ROOT, "base_url": None},
    }
)
PRIVATE_STORAGE_ENABLED = not _use_r2 or bool(CLOUDFLARE_R2_PRIVATE_BUCKET_NAME)
# Hạn của link ký tới file riêng tư (giây).
ATTACHMENT_PRIVATE_URL_TTL_SECONDS = env.int("ATTACHMENT_PRIVATE_URL_TTL_SECONDS", default=300)

STORAGES = {
    "default": {
        "BACKEND": _configured_storage,
    },
    "private": _private_storage,
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
ATTACHMENT_MAX_SIZE_BYTES = env.int("ATTACHMENT_MAX_SIZE_BYTES", default=5 * 1024 * 1024)
# Tổng dung lượng lưu trữ tối đa cho phép trên storage (R2/S3/local).
# Mặc định 9GB (gói miễn phí của Cloudflare R2 là 10GB).
# Hạn mức dung lượng database (Neon free: 1 GB/project). Cron dọn dẹp cảnh báo khi dùng từ 80%; 0 = tắt.
DATABASE_MAX_BYTES = env.int("DATABASE_MAX_BYTES", default=1024 * 1024 * 1024)
ATTACHMENT_MAX_TOTAL_STORAGE_BYTES = env.int(
    "ATTACHMENT_MAX_TOTAL_STORAGE_BYTES", default=9 * 1024 * 1024 * 1024
)
# File của tệp đã xóa mềm và file mồ côi (ảnh QR cũ...) bị dọn khỏi storage sau số ngày này.
ATTACHMENT_PURGE_DAYS = env.int("ATTACHMENT_PURGE_DAYS", default=30)
ATTACHMENT_ALLOWED_CONTENT_TYPES = ALLOWED_CONTENT_TYPES
# Giới hạn body không tính file upload (file theo ATTACHMENT_MAX_SIZE_BYTES).
DATA_UPLOAD_MAX_MEMORY_SIZE = env.int("DATA_UPLOAD_MAX_MEMORY_SIZE", default=1024 * 1024)
FILE_UPLOAD_MAX_MEMORY_SIZE = ATTACHMENT_MAX_SIZE_BYTES

LANGUAGE_CODE = "vi"
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "app.system.authentications.cookie_jwt_authentication.CookieJwtAuthentication",
    ],
    # Mặc định DENY: endpoint public phải khai báo AllowAny tường minh.
    # Mặc định: đăng nhập + quyền IAM đã khai (không khai → 403). View công khai ghi đè trong chính view đó.
    "DEFAULT_PERMISSION_CLASSES": [
        "app.core.permissions.is_active_authenticated.IsActiveAuthenticated",
        "app.system.permissions.has_iam_permission.HasIamPermission",
    ],
    # Rate limit khai báo (`action_rate_limits` / `@rate_limit`), đếm bằng bucket PostgreSQL.
    "DEFAULT_THROTTLE_CLASSES": ["app.system.throttles.bucket_throttle.BucketThrottle"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER": "app.core.exceptions.exception_handler.app_exception_handler",
    # Lọc / tìm kiếm / sắp xếp / phân trang chuẩn DRF cho mọi ViewSet:
    # ?<field>=...  ?search=...  ?ordering=-created_at  ?page=1&page_size=20
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "app.core.filters.core_search_filter.CoreSearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "app.core.pagination.core_page_number_pagination.CorePageNumberPagination",
    "DEFAULT_SCHEMA_CLASS": "app.core.schemas.core_auto_schema.CoreAutoSchema",
}
SPECTACULAR_SETTINGS = {
    "TITLE": "ToanNX API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "ENUM_NAME_OVERRIDES": {
        "CustomPageStatusEnum": [
            ("DRAFT", "Bản nháp"),
            ("PUBLISHED", "Công khai"),
            ("UNPUBLISHED", "Ngừng công khai"),
        ],
        "ShortLinkStatusEnum": [("ACTIVE", "Hoạt động"), ("INACTIVE", "Tạm tắt")],
        "FinanceRateSourceEnum": "app.finance.constants.finance_choices.RateSource",
        "FinanceManualRateSourceEnum": [("API", "Tự động (Vietcombank)"), ("MANUAL", "Nhập tay")],
        "NovelStatusEnum": [
            ("ONGOING", "Đang ra"),
            ("COMPLETED", "Hoàn thành"),
            ("PAUSED", "Tạm dừng"),
        ],
        "WorkspaceAssetCategoryEnum": "app.workspace.models.asset.Asset.Category",
        "WorkspaceAssetStatusEnum": "app.workspace.models.asset.Asset.Status",
        "WorkspaceAssetPurchaseChannelEnum": "app.workspace.models.asset.Asset.PurchaseChannel",
        "WorkspaceAssetWarrantyTypeEnum": "app.workspace.models.asset.Asset.WarrantyType",
        "WorkspaceClaimTypeEnum": "app.workspace.models.asset_warranty_claim.AssetWarrantyClaim.ClaimType",
        "WorkspaceClaimStatusEnum": "app.workspace.models.asset_warranty_claim.AssetWarrantyClaim.Status",
        "WorkspaceSubscriptionCategoryEnum": "app.workspace.models.subscription.Subscription.Category",
        "WorkspaceBillingCycleEnum": "app.workspace.models.subscription.Subscription.BillingCycle",
        "WorkspaceVaultCategoryEnum": "app.workspace.models.vault_item.VaultItem.Category",
        "WorkspaceReminderPriorityEnum": "app.workspace.models.reminder.Reminder.Priority",
        "WorkspaceReminderRecurrenceEnum": "app.workspace.models.reminder.Reminder.Recurrence",
        "WorkspaceGroupToolPolicyEnum": "app.workspace.constants.group_tool_policy.GroupToolPolicy",
        "WorkspaceAssistantChannelEnum": (
            "app.workspace.models.assistant_conversation.AssistantConversation.Channel"
        ),
        "WorkspaceAssistantRoleEnum": "app.workspace.models.assistant_message.AssistantMessage.Role",
    },
}

# Xác thực: access JWT ngắn hạn (ký HS256 bằng SECRET_KEY) + refresh token xoay vòng (chỉ lưu hash)
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "api"
JWT_AUDIENCE = "web"
AUTH_ACCESS_TOKEN_LIFETIME_SECONDS = env.int("AUTH_ACCESS_TOKEN_LIFETIME_SECONDS", default=600)
AUTH_REFRESH_TOKEN_LIFETIME_SECONDS = env.int("AUTH_REFRESH_TOKEN_LIFETIME_SECONDS", default=7 * 24 * 3600)
# Refresh token vừa xoay vòng trong khoảng này được coi là request đồng thời, không phải reuse.
AUTH_REFRESH_REUSE_GRACE_SECONDS = 10

AUTH_COOKIE_SECURE = not DEBUG
AUTH_COOKIE_DOMAIN = env.str("AUTH_COOKIE_DOMAIN", default="")
AUTH_ACCESS_COOKIE_NAME = "access_token"
AUTH_ACCESS_COOKIE_PATH = "/api"
AUTH_REFRESH_COOKIE_NAME = "refresh_token"
AUTH_REFRESH_COOKIE_PATH = "/api/v1/system/auth"
AUTH_SESSION_HINT_COOKIE_NAME = "session_hint"

# CSRF: double-submit cookie của Django + kiểm tra Origin
CSRF_COOKIE_NAME = "csrftoken"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax" if DEBUG else "None"
CSRF_COOKIE_SECURE = not DEBUG
CSRF_TRUSTED_ORIGINS: list[str] = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:3001"])
if DEBUG:
    for _dev_origin in [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]:
        if _dev_origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(_dev_origin)

CORS_ALLOWED_ORIGINS: list[str] = env.list("CORS_ALLOWED_ORIGINS", default=[])
if DEBUG:
    for _dev_origin in [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]:
        if _dev_origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(_dev_origin)

CORS_ALLOWED_ORIGIN_REGEXES: list[str] = [
    r"^https:\/\/toannx-frontend(-[a-z0-9-]+)?\.vercel\.app$",
    r"^https:\/\/toannx-frontend(-[a-z0-9-]+)?-nxtoan2k4-1833s-projects\.vercel\.app$",
]
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ["Content-Disposition", "X-Request-ID"]
CORS_ALLOW_HEADERS: list[str] = [
    *default_headers,
    "x-request-id",
]

# Rate limit đăng nhập lưu trên PostgreSQL (Vercel không giữ bộ nhớ giữa các invocation)
RATE_LIMIT_ENABLED = env.bool("RATE_LIMIT_ENABLED", default=True)
SHORT_LINK_INTERNAL_HOSTS = env.list(
    "SHORT_LINK_INTERNAL_HOSTS", default=["toannx.com", "www.toannx.com", "localhost"]
)
# Bảng rate limit duy nhất: khóa (`StrEnum`) → (số lần, cửa sổ giây, "user" | "ip").
# ViewSet khai `action_rate_limits = {"create": <Module>RateLimitKey.X}`, APIView khai `@rate_limit(<Key>)`.
RATE_LIMITS: dict[StrEnum, tuple[int, int, str]] = {
    CoreRateLimitKey.DEFAULT_WRITE: (env.int("RL_DEFAULT_WRITE", default=300), 60, "user"),
    CoreRateLimitKey.PUBLIC_READ: (env.int("RL_PUBLIC_READ", default=120), 60, "ip"),
    SystemRateLimitKey.PASSWORD_RESET_REQUEST: (
        env.int("RL_AUTH_PASSWORD_RESET_REQUEST", default=5),
        900,
        "ip",
    ),
    SystemRateLimitKey.PASSWORD_RESET_VALIDATE: (
        env.int("RL_AUTH_PASSWORD_RESET_VALIDATE", default=30),
        900,
        "ip",
    ),
    SystemRateLimitKey.PASSWORD_RESET_CONFIRM: (
        env.int("RL_AUTH_PASSWORD_RESET_CONFIRM", default=10),
        900,
        "ip",
    ),
    SystemRateLimitKey.EMAIL_VERIFICATION_SEND: (
        env.int("RL_EMAIL_VERIFICATION_SEND", default=5),
        300,
        "user",
    ),
    SystemRateLimitKey.EMAIL_VERIFICATION_VERIFY: (
        env.int("RL_EMAIL_VERIFICATION_VERIFY", default=30),
        900,
        "ip",
    ),
    SystemRateLimitKey.INVITATION_VALIDATE: (env.int("RL_INVITATION_VALIDATE", default=30), 900, "ip"),
    SystemRateLimitKey.INVITATION_ACCEPT: (env.int("RL_INVITATION_ACCEPT", default=10), 900, "ip"),
    SystemRateLimitKey.SOCIAL_AUTH: (env.int("RL_SOCIAL_AUTH", default=30), 900, "ip"),
    SystemRateLimitKey.SOCIAL_LINK: (env.int("RL_SOCIAL_LINK", default=10), 900, "user"),
    SystemRateLimitKey.SOCIAL_UNLINK: (env.int("RL_SOCIAL_UNLINK", default=10), 900, "user"),
    UtilitiesRateLimitKey.SHORT_LINK_CREATE: (env.int("RL_SHORT_LINK_CREATE", default=30), 3600, "user"),
    UtilitiesRateLimitKey.SHORT_LINK_UNLOCK: (env.int("RL_SHORT_LINK_UNLOCK", default=10), 60, "ip"),
    UtilitiesRateLimitKey.PAGE_CREATE: (env.int("RL_PAGE_CREATE", default=20), 3600, "user"),
    UtilitiesRateLimitKey.PAGE_PATH_CREATE: (env.int("RL_PAGE_PATH_CREATE", default=10), 3600, "user"),
    UtilitiesRateLimitKey.QR_CODE_CREATE: (env.int("RL_QR_CREATE", default=60), 3600, "user"),
    UtilitiesRateLimitKey.QR_CODE_PREVIEW: (env.int("RL_QR_PREVIEW", default=120), 60, "user"),
    UtilitiesRateLimitKey.DONATION_WEBHOOK: (env.int("RL_DONATION_WEBHOOK", default=120), 60, "ip"),
    SystemRateLimitKey.CLIENT_ERROR_CREATE: (env.int("RL_CLIENT_ERROR", default=30), 60, "ip"),
    SystemRateLimitKey.ATTACHMENT_CONTENT: (env.int("RL_ATTACHMENT_CONTENT", default=120), 60, "user"),
    FinanceRateLimitKey.SEPAY_CALL: (env.int("RL_SEPAY_CALL", default=10), 60, "user"),
    FinanceRateLimitKey.SEPAY_WEBHOOK: (env.int("RL_SEPAY_WEBHOOK", default=120), 60, "ip"),
    SystemRateLimitKey.TELEGRAM_CALL: (env.int("RL_TELEGRAM_CALL", default=20), 60, "user"),
    SystemRateLimitKey.TELEGRAM_WEBHOOK: (env.int("RL_TELEGRAM_WEBHOOK", default=120), 60, "ip"),
    NovelRateLimitKey.CREATE: (env.int("RL_NOVEL_CREATE", default=60), 3600, "user"),
    NovelRateLimitKey.IMPORT: (env.int("RL_NOVEL_IMPORT", default=10), 3600, "user"),
    WorkspaceRateLimitKey.ASSET_CREATE: (env.int("RL_WS_ASSET_CREATE", default=60), 3600, "user"),
    WorkspaceRateLimitKey.WARRANTY_CLAIM_CREATE: (env.int("RL_WS_CLAIM_CREATE", default=60), 3600, "user"),
    WorkspaceRateLimitKey.SUBSCRIPTION_CREATE: (env.int("RL_WS_SUB_CREATE", default=60), 3600, "user"),
    WorkspaceRateLimitKey.SUBSCRIPTION_RENEW: (env.int("RL_WS_SUB_RENEW", default=60), 3600, "user"),
    WorkspaceRateLimitKey.VAULT_CREATE: (env.int("RL_WS_VAULT_CREATE", default=60), 3600, "user"),
    WorkspaceRateLimitKey.VAULT_REVEAL: (env.int("RL_WS_VAULT_REVEAL", default=30), 60, "user"),
    WorkspaceRateLimitKey.REMINDER_CREATE: (env.int("RL_WS_REMINDER_CREATE", default=120), 3600, "user"),
    WorkspaceRateLimitKey.ASSISTANT_CHAT: (env.int("RL_WS_ASSISTANT_CHAT", default=30), 60, "user"),
    WorkspaceRateLimitKey.CRON_TICK: (env.int("RL_WS_CRON_TICK", default=60), 60, "ip"),
    WorkspaceRateLimitKey.CRON_DISPATCH_DUE: (env.int("RL_WS_CRON_DISPATCH", default=60), 60, "ip"),
    WorkspaceRateLimitKey.TELEGRAM_PROCESS: (env.int("RL_WS_TELEGRAM_PROCESS", default=120), 60, "ip"),
}
# Lịch sử thay đổi: model kế thừa JournalTracker tự ghi qua recorder này (rỗng = tắt).
CORE_CHANGE_RECORDER = "app.system.recorders.journal_recorder.JournalRecorder"
JOURNAL_RETENTION_DAYS = env.int("JOURNAL_RETENTION_DAYS", default=365)
# Phiên/refresh token hết hạn quá số ngày này thì bị dọn.
AUTH_EXPIRED_RETENTION_DAYS = env.int("AUTH_EXPIRED_RETENTION_DAYS", default=30)
# Header bí mật của Vercel Cron khi gọi /api/v1/system/health/cleanup (rỗng = tắt endpoint).
CRON_SECRET = env.str("CRON_SECRET", default="")

# SePay (module Tài chính). Bí mật chỉ ở ENV, không lưu DB, không trả ra client.
SEPAY_ENV = env.str("SEPAY_ENV", default="sandbox")
if SEPAY_ENV not in ("sandbox", "production"):
    raise ValueError("SEPAY_ENV phải là 'sandbox' hoặc 'production'.")
# Telegram Bot chung toàn hệ thống (dùng cho thông báo + Trợ lý AI Telegram hai chiều).
TELEGRAM_BOT_TOKEN = env.str("TELEGRAM_BOT_TOKEN", default="").strip()
TELEGRAM_BOT_USERNAME = env.str("TELEGRAM_BOT_USERNAME", default="").lstrip("@").strip()
# Trợ lý AI OpenAI-compatible (xKiro Multi-Model Fallback; mọi lượt gọi <= 5 giây).
XKIRO_API_BASE = env.str("XKIRO_API_BASE", default="").strip()
XKIRO_API_KEY = env.str("XKIRO_API_KEY", default="").strip()
XKIRO_MODEL = env.str("XKIRO_MODEL", default="").strip()
XKIRO_FALLBACK_MODELS: list[str] = [
    item.strip() for item in env.list("XKIRO_FALLBACK_MODELS", default=[]) if str(item).strip()
]
XKIRO_TIMEOUT_SECONDS = env.float("XKIRO_TIMEOUT_SECONDS", default=5.0)
if not (1.0 <= XKIRO_TIMEOUT_SECONDS <= 5.0):
    raise ValueError("XKIRO_TIMEOUT_SECONDS phải nằm trong khoảng [1, 5] giây.")
XKIRO_COOLDOWN_SECONDS = env.int("XKIRO_COOLDOWN_SECONDS", default=120)
# Firebase Cloud Messaging (thông báo trình duyệt); thiếu một trong hai thì kênh PUSH bị ẩn.
FIREBASE_PROJECT_ID = env.str("FIREBASE_PROJECT_ID", default="")
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = env.str("FIREBASE_SERVICE_ACCOUNT_JSON_BASE64", default="")
# Request không gửi thông báo ra ngoài: chỉ ghi outbox rồi "đá" QStash gọi lại endpoint dispatch
# (lượt function riêng). Thiếu QSTASH_TOKEN thì chỉ còn cron ngoài gửi
# (xem docs/guides/notification-setup.md).
QSTASH_URL = env.str("QSTASH_URL", default="") or "https://qstash.upstash.io"
QSTASH_TOKEN = env.str("QSTASH_TOKEN", default="")
QSTASH_CURRENT_SIGNING_KEY = env.str("QSTASH_CURRENT_SIGNING_KEY", default="")
QSTASH_NEXT_SIGNING_KEY = env.str("QSTASH_NEXT_SIGNING_KEY", default="")

# Redis (Upstash) chỉ để tăng tốc: cache công khai, bộ đếm rate limit, cờ outbox. Trống = không dùng
# (rate limit về PostgreSQL, không cache). Redis lỗi cũng tự về dự phòng, không trả 500.
REDIS_URL = env.str("REDIS_URL", default="")

# Tiện ích → Trang tùy chỉnh: giới hạn nội dung Tiptap và đoạn đường dẫn giữa dành riêng (một chỗ duy nhất).
CUSTOM_PAGE_CONTENT_MAX_BYTES = env.int("CUSTOM_PAGE_CONTENT_MAX_BYTES", default=256 * 1024)
CUSTOM_PAGE_MAX_IMAGES = env.int("CUSTOM_PAGE_MAX_IMAGES", default=30)
CUSTOM_PAGE_MAX_VIDEOS = env.int("CUSTOM_PAGE_MAX_VIDEOS", default=10)
PUBLIC_RESERVED_SEGMENTS = frozenset(
    {
        "vi",
        "en",
        "api",
        "s",
        "_next",
        "admin",
        "quan-tri",
        "login",
        "dang-nhap",
        "robots",
        "sitemap",
        "icon",
        "media",
        "static",
        "favicon",
        "demo",
        "portal",
        "ca-nhan",
    }
)

# Quota tổng mỗi owner (CoreCrudService.owner_quota_setting).
SHORT_LINK_MAX_PER_OWNER = env.int("SHORT_LINK_MAX_PER_OWNER", default=500)
CUSTOM_PAGE_MAX_PER_OWNER = env.int("CUSTOM_PAGE_MAX_PER_OWNER", default=50)
QR_CODE_MAX_PER_OWNER = env.int("QR_CODE_MAX_PER_OWNER", default=200)
AUTH_LOGIN_RATE_LIMIT = env.int("AUTH_LOGIN_RATE_LIMIT", default=10)
AUTH_LOGIN_RATE_WINDOW_SECONDS = 15 * 60

# Cấu hình gửi email (quên mật khẩu, thông báo hệ thống...)
# Local / test: console hoặc locmem; production: SMTP hoặc qua môi trường
EMAIL_BACKEND = env.str(
    "EMAIL_BACKEND",
    default=(
        "django.core.mail.backends.console.EmailBackend"
        if DEBUG
        else "django.core.mail.backends.smtp.EmailBackend"
    ),
)
EMAIL_HOST = env.str("EMAIL_HOST", default="localhost")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env.str("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env.str("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=5)
DEFAULT_FROM_EMAIL = env.str("DEFAULT_FROM_EMAIL", default="no-reply@toannx.com")
PASSWORD_RESET_TIMEOUT = env.int("PASSWORD_RESET_TIMEOUT", default=15 * 60)
# Mặc định lấy origin động từ request; FRONTEND_URL chỉ là fallback khi không có request
FRONTEND_URL = env.str("FRONTEND_URL", default="")
# Gửi email theo mẫu (quên mật khẩu, xác minh, lời mời) ở luồng nền. Mặc định False: trên Vercel luồng nền
# có thể bị dừng khi response trả xong làm mất thư; chỉ bật khi chạy server lâu dài.
EMAIL_ASYNC = env.bool("EMAIL_ASYNC", default=False)

# Cấu hình đăng nhập & liên kết mạng xã hội qua OAuth (Google, GitHub...)
GOOGLE_OAUTH_CLIENT_ID = env.str("GOOGLE_OAUTH_CLIENT_ID", default="")
GOOGLE_OAUTH_CLIENT_SECRET = env.str("GOOGLE_OAUTH_CLIENT_SECRET", default="")
GITHUB_OAUTH_CLIENT_ID = env.str("GITHUB_OAUTH_CLIENT_ID", default="")
GITHUB_OAUTH_CLIENT_SECRET = env.str("GITHUB_OAUTH_CLIENT_SECRET", default="")

# Backend luôn đứng sau proxy (Next.js rewrite / Vercel): lấy domain + scheme gốc của trình duyệt
# từ X-Forwarded-* để dựng URL tuyệt đối (ví dụ URL file). Host vẫn phải nằm trong ALLOWED_HOSTS.
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {"request_context": {"()": "app.core.logging.request_context_filter.RequestContextFilter"}},
    "formatters": {
        "default": {"format": "%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "filters": ["request_context"],
        },
    },
    "root": {"handlers": ["console"], "level": env.str("LOG_LEVEL", default="INFO")},
}
