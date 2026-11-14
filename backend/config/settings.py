"""Cấu hình Django của TOANNX.

Một file cấu hình duy nhất; local và production chỉ khác nhau ở biến môi trường
(DJANGO_DEBUG, DB_*, DJANGO_SECRET_KEY...). Không hardcode secrets.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env", overwrite=False)

# Secret dùng chung cho toàn hệ thống: session/CSRF của Django, ký access JWT, HMAC refresh token.
# Đổi giá trị này sẽ vô hiệu mọi phiên đăng nhập.
SECRET_KEY = env.str("DJANGO_SECRET_KEY")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS: list[str] = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
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
    "app.modules.system",
    "app.modules.health",
    "app.modules.short_links",
    "app.modules.custom_pages",
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
        # Neon bắt buộc `require`; local để `prefer`.
        "OPTIONS": {"sslmode": env.str("DB_SSLMODE", default="prefer")},
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
# STORAGES["default"] sang object storage (S3/R2/Vercel Blob) qua biến môi trường.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
STORAGES = {
    "default": {
        "BACKEND": env.str("FILE_STORAGE_BACKEND", default="django.core.files.storage.FileSystemStorage")
    },
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
ATTACHMENT_MAX_SIZE_BYTES = env.int("ATTACHMENT_MAX_SIZE_BYTES", default=5 * 1024 * 1024)
ATTACHMENT_ALLOWED_CONTENT_TYPES = (
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/svg+xml",  # chỉ nhận SVG đã qua svg_inspector (không script/link ngoài)
    "application/pdf",
)
DATA_UPLOAD_MAX_MEMORY_SIZE = ATTACHMENT_MAX_SIZE_BYTES + 1024 * 1024

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
    "DEFAULT_PERMISSION_CLASSES": [
        "app.modules.iam.permissions.is_active_authenticated.IsActiveAuthenticated"
    ],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "EXCEPTION_HANDLER": "app.core.exceptions.exception_handler.app_exception_handler",
    # Lọc / tìm kiếm / sắp xếp / phân trang chuẩn DRF cho mọi ViewSet:
    # ?<field>=...  ?search=...  ?ordering=-created_at  ?page=1&page_size=20
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
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
    },
}

# Permission gắn tự động vào mọi view kế thừa core (CoreApiView, CoreModelViewSet):
# chặn API của module đang tắt; module của view suy ra từ app chứa view.
MODULE_PERMISSION_CLASSES = ["app.modules.system.permissions.module_enabled.ModuleEnabled"]

# Xác thực: access JWT ngắn hạn (ký HS256 bằng SECRET_KEY) + refresh token xoay vòng (chỉ lưu hash)
JWT_ALGORITHM = "HS256"
JWT_ISSUER = "toannx-api"
JWT_AUDIENCE = "toannx-web"
AUTH_ACCESS_TOKEN_LIFETIME_SECONDS = env.int("AUTH_ACCESS_TOKEN_LIFETIME_SECONDS", default=600)
AUTH_REFRESH_TOKEN_LIFETIME_SECONDS = env.int("AUTH_REFRESH_TOKEN_LIFETIME_SECONDS", default=7 * 24 * 3600)
# Refresh token vừa xoay vòng trong khoảng này được coi là request đồng thời, không phải reuse.
AUTH_REFRESH_REUSE_GRACE_SECONDS = 10

AUTH_COOKIE_SECURE = not DEBUG
AUTH_ACCESS_COOKIE_NAME = "toannx_access"
AUTH_ACCESS_COOKIE_PATH = "/api"
AUTH_REFRESH_COOKIE_NAME = "toannx_refresh"
AUTH_REFRESH_COOKIE_PATH = "/api/v1/auth"
AUTH_SESSION_HINT_COOKIE_NAME = "toannx_session"

# CSRF: double-submit cookie của Django + kiểm tra Origin
CSRF_COOKIE_NAME = "toannx_csrf"
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not DEBUG
CSRF_TRUSTED_ORIGINS: list[str] = env.list("CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000"])

CORS_ALLOWED_ORIGINS: list[str] = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS = True

# Rate limit đăng nhập lưu trên PostgreSQL (Vercel không giữ bộ nhớ giữa các invocation)
RATE_LIMIT_ENABLED = env.bool("RATE_LIMIT_ENABLED", default=True)
SHORT_LINK_INTERNAL_HOSTS = env.list(
    "SHORT_LINK_INTERNAL_HOSTS", default=["toannx.com", "www.toannx.com", "localhost"]
)
SHORT_LINK_CREATE_RATE_LIMIT = env.int("SHORT_LINK_CREATE_RATE_LIMIT", default=30)
CUSTOM_PAGE_CREATE_RATE_LIMIT = env.int("CUSTOM_PAGE_CREATE_RATE_LIMIT", default=20)
CUSTOM_PAGE_BLOCK_CREATE_RATE_LIMIT = env.int("CUSTOM_PAGE_BLOCK_CREATE_RATE_LIMIT", default=120)
AUTH_LOGIN_RATE_LIMIT = env.int("AUTH_LOGIN_RATE_LIMIT", default=10)
AUTH_LOGIN_RATE_WINDOW_SECONDS = 15 * 60

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
