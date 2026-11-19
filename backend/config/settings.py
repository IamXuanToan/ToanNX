"""Cấu hình Django của TOANNX.

Một file cấu hình duy nhất; local và production chỉ khác nhau ở biến môi trường
(DJANGO_DEBUG, DB_*, DJANGO_SECRET_KEY...). Không hardcode secrets.
"""

from pathlib import Path

import environ

from app.core.logging.sentry import init_sentry
from app.modules.attachment.constants.media_types import ALLOWED_CONTENT_TYPES

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env.local", overwrite=False)
environ.Env.read_env(BASE_DIR / ".env", overwrite=False)

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
    "app.modules.attachment",
    "app.modules.account",
    "app.modules.iam",
    "app.modules.authentication",
    "app.modules.health",
    "app.modules.short_links",
    "app.modules.custom_pages",
    "app.modules.journal",
    "app.modules.qr_codes",
    "app.modules.novel",
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
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env.str("DB_NAME"),
        "USER": env.str("DB_USER"),
        "PASSWORD": env.str("DB_PASSWORD"),
        "HOST": env.str("DB_HOST", default="localhost"),
        "PORT": env.int("DB_PORT", default=5432),
        # Serverless + pooler (Neon/Vercel): 0 = mở/đóng kết nối mỗi request.
        "CONN_MAX_AGE": env.int("DB_CONN_MAX_AGE", default=0),
        "CONN_HEALTH_CHECKS": True,
        "TEST": {"NAME": "test_toannx"},
    }
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Người dùng & mật khẩu
AUTH_USER_MODEL = "account.User"
AUTHENTICATION_BACKENDS = [
    "app.modules.account.backends.account_auth_backend.AccountAuthBackend",
    "app.modules.iam.backends.iam_permission_backend.IamPermissionBackend",
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
CLOUDFLARE_R2_CUSTOM_DOMAIN = env.str("CLOUDFLARE_R2_CUSTOM_DOMAIN", default="")
CLOUDFLARE_R2_ENDPOINT_URL = env.str("CLOUDFLARE_R2_ENDPOINT_URL", default="")

_configured_storage = env.str("FILE_STORAGE_BACKEND", default="")
_use_r2 = bool(
    _configured_storage == "app.core.storage.r2_storage.R2Storage"
    or (CLOUDFLARE_R2_BUCKET_NAME and _configured_storage != "django.core.files.storage.FileSystemStorage")
)

if not _configured_storage:
    _configured_storage = (
        "app.core.storage.r2_storage.R2Storage"
        if _use_r2
        else "django.core.files.storage.FileSystemStorage"
    )

MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = (
    f"https://{CLOUDFLARE_R2_CUSTOM_DOMAIN.replace('https://', '').replace('http://', '').rstrip('/')}/"
    if (_use_r2 and CLOUDFLARE_R2_CUSTOM_DOMAIN)
    else "/media/"
)

STORAGES = {
    "default": {
        "BACKEND": _configured_storage,
    },
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
ATTACHMENT_MAX_SIZE_BYTES = env.int("ATTACHMENT_MAX_SIZE_BYTES", default=5 * 1024 * 1024)
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
        "app.modules.authentication.authentications.cookie_jwt_authentication.CookieJwtAuthentication",
    ],
    # Mặc định DENY: endpoint public phải khai báo AllowAny tường minh.
    # Mặc định: đăng nhập + quyền IAM đã khai (không khai → 403). View công khai ghi đè trong chính view đó.
    "DEFAULT_PERMISSION_CLASSES": [
        "app.core.permissions.is_active_authenticated.IsActiveAuthenticated",
        "app.modules.iam.permissions.has_iam_permission.HasIamPermission",
    ],
    # Rate limit khai báo (`action_rate_limits` / `@rate_limit`), đếm bằng bucket PostgreSQL.
    "DEFAULT_THROTTLE_CLASSES": ["app.modules.authentication.throttles.bucket_throttle.BucketThrottle"],
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
    "TITLE": "TOANNX API",
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
        "NovelStatusEnum": [
            ("ONGOING", "Đang ra"),
            ("COMPLETED", "Hoàn thành"),
            ("PAUSED", "Tạm dừng"),
        ],
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
AUTH_ACCESS_COOKIE_NAME = "access_token"
AUTH_ACCESS_COOKIE_PATH = "/api"
AUTH_REFRESH_COOKIE_NAME = "refresh_token"
AUTH_REFRESH_COOKIE_PATH = "/api/v1/auth"
AUTH_SESSION_HINT_COOKIE_NAME = "session_hint"

# CSRF: double-submit cookie của Django + kiểm tra Origin
CSRF_COOKIE_NAME = "csrftoken"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = not DEBUG
CSRF_TRUSTED_ORIGINS: list[str] = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000"])

CORS_ALLOWED_ORIGINS: list[str] = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = True

# Rate limit đăng nhập lưu trên PostgreSQL (Vercel không giữ bộ nhớ giữa các invocation)
RATE_LIMIT_ENABLED = env.bool("RATE_LIMIT_ENABLED", default=True)
SHORT_LINK_INTERNAL_HOSTS = env.list(
    "SHORT_LINK_INTERNAL_HOSTS", default=["toannx.com", "www.toannx.com", "localhost"]
)
# Bảng rate limit duy nhất: khóa → (số lần, cửa sổ giây, "user" | "ip").
# ViewSet khai `action_rate_limits = {"create": "<khóa>"}`, APIView khai `@rate_limit("<khóa>")`.
RATE_LIMITS: dict[str, tuple[int, int, str]] = {
    "default.write": (env.int("RL_DEFAULT_WRITE", default=300), 60, "user"),
    "public.read": (env.int("RL_PUBLIC_READ", default=120), 60, "ip"),
    "auth.password_reset_request": (env.int("RL_AUTH_PASSWORD_RESET_REQUEST", default=5), 900, "ip"),
    "auth.password_reset_validate": (env.int("RL_AUTH_PASSWORD_RESET_VALIDATE", default=30), 900, "ip"),
    "auth.password_reset_confirm": (env.int("RL_AUTH_PASSWORD_RESET_CONFIRM", default=10), 900, "ip"),
    "short_links.create": (env.int("RL_SHORT_LINK_CREATE", default=30), 3600, "user"),
    "short_links.unlock": (env.int("RL_SHORT_LINK_UNLOCK", default=10), 60, "ip"),
    "custom_pages.create": (env.int("RL_PAGE_CREATE", default=20), 3600, "user"),
    "custom_pages.path.create": (env.int("RL_PAGE_PATH_CREATE", default=10), 3600, "user"),
    "qr_codes.create": (env.int("RL_QR_CREATE", default=60), 3600, "user"),
    "qr_codes.preview": (env.int("RL_QR_PREVIEW", default=120), 60, "user"),
    "health.client_error": (env.int("RL_CLIENT_ERROR", default=30), 60, "ip"),
    "novel.create": (env.int("RL_NOVEL_CREATE", default=60), 3600, "user"),
    "novel.import": (env.int("RL_NOVEL_IMPORT", default=10), 3600, "user"),
}
# Lịch sử thay đổi: model kế thừa JournalTracker tự ghi qua recorder này (rỗng = tắt).
CORE_CHANGE_RECORDER = "app.modules.journal.recorders.journal_recorder.JournalRecorder"
JOURNAL_RETENTION_DAYS = env.int("JOURNAL_RETENTION_DAYS", default=365)
# Phiên/refresh token hết hạn quá số ngày này thì bị dọn.
AUTH_EXPIRED_RETENTION_DAYS = env.int("AUTH_EXPIRED_RETENTION_DAYS", default=30)
# Header bí mật của Vercel Cron khi gọi POST /health/cleanup (rỗng = tắt endpoint).
CRON_SECRET = env.str("CRON_SECRET", default="")

# Custom Pages: giới hạn nội dung Tiptap và đoạn đường dẫn giữa dành riêng (một chỗ duy nhất).
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
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=10)
DEFAULT_FROM_EMAIL = env.str("DEFAULT_FROM_EMAIL", default="no-reply@toannx.com")
PASSWORD_RESET_TIMEOUT = env.int("PASSWORD_RESET_TIMEOUT", default=15 * 60)
# Mặc định lấy origin động từ request; FRONTEND_URL chỉ là fallback khi không có request
FRONTEND_URL = env.str("FRONTEND_URL", default="")
# Gửi email bất đồng bộ qua background worker thread (tránh block request web)
EMAIL_ASYNC = env.bool("EMAIL_ASYNC", default=True)

# Backend luôn đứng sau proxy (Next.js rewrite / Vercel): lấy domain + scheme gốc của trình duyệt
# từ X-Forwarded-* để dựng URL tuyệt đối (ví dụ URL file). Host vẫn phải nằm trong ALLOWED_HOSTS.
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

# Báo lỗi lên Sentry: để trống SENTRY_DSN là tắt (local, test).
SENTRY_DSN = env.str("SENTRY_DSN", default="")
init_sentry(
    dsn=SENTRY_DSN,
    environment=env.str("SENTRY_ENVIRONMENT", default="production"),
    release=env.str("VERCEL_GIT_COMMIT_SHA", default=""),
    traces_sample_rate=env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.0),
)

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
