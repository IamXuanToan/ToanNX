"""Fixture dùng chung. Test chạy trên DB `test_toannx` do pytest-django tạo."""

from collections.abc import Callable
from importlib import import_module
from typing import Any

import pytest
from django.conf import settings as django_settings
from rest_framework.test import APIClient

from app.core.cache.cache_service import CacheService
from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.models.currency import Currency
from app.system.models.permission import Permission
from app.system.models.setting import Setting
from app.system.models.user import User
from app.system.services.role_seed_service import RoleSeedService
from app.system.tests.factories.staff_factory import StaffFactory
from app.system.tests.factories.superuser_factory import SuperuserFactory
from app.system.tests.factories.user_factory import DEFAULT_PASSWORD, UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page_path import PagePath

# Test chỉ chạy trên PostgreSQL ở máy này: DB cloud (Neon…) chậm, dễ timeout và có thể là dữ liệu thật.
LOCAL_DB_HOSTS = {"localhost", "127.0.0.1", "::1"}


def pytest_sessionstart(session: pytest.Session) -> None:
    """Dừng ngay nếu `DATABASE_URL` không trỏ về PostgreSQL local (xem `backend/.env.local`)."""
    host = django_settings.DATABASES["default"].get("HOST") or "localhost"
    if host not in LOCAL_DB_HOSTS:
        pytest.exit(
            f"Test phải chạy trên PostgreSQL local, DATABASE_URL đang trỏ tới {host!r}. "
            "Tạo backend/.env.local với DATABASE_URL=postgresql://...@localhost:5432/toannx.",
            returncode=2,
        )


@pytest.fixture(autouse=True)
def _no_external_services(settings: Any) -> None:
    """Không gọi dịch vụ ngoài trong test (R2 Usage API, R2, Firebase, Upstash) dù `.env` có khóa thật.

    Cloudflare R2 dùng gói miễn phí giới hạn lượt gọi; test cần thì tự đặt lại setting trong test đó.
    """
    settings.CLOUDFLARE_API_TOKEN = ""
    settings.CLOUDFLARE_R2_ACCOUNT_ID = ""
    settings.CLOUDFLARE_R2_BUCKET_NAME = ""
    settings.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME = ""
    settings.FIREBASE_PROJECT_ID = ""
    settings.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = ""
    # Upstash: không dùng Redis/QStash thật (gói free giới hạn lệnh/tin); test cần thì dùng `fake_redis`.
    settings.REDIS_URL = ""
    settings.QSTASH_TOKEN = ""
    settings.QSTASH_CURRENT_SIGNING_KEY = ""
    settings.QSTASH_NEXT_SIGNING_KEY = ""
    CacheService.use_client(None)


@pytest.fixture(autouse=True)
def _fast_hasher(settings: Any) -> None:
    """Hasher nhanh cho test (cấu hình thật dùng Argon2, có test riêng)."""
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture(autouse=True)
def _isolated_media(settings: Any, tmp_path: Any) -> None:
    """Mỗi test ghi file vào thư mục tạm, không đụng `backend/media` của dev."""
    media_dir = str(tmp_path / "media")
    private_dir = str(tmp_path / "private_media")
    settings.MEDIA_ROOT = media_dir
    settings.PRIVATE_MEDIA_ROOT = private_dir
    settings.PRIVATE_STORAGE_ENABLED = True
    settings.MEDIA_URL = "/media/"
    settings.STORAGES = {
        **settings.STORAGES,
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
            "OPTIONS": {"location": media_dir, "base_url": "/media/"},
        },
        "private": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
            "OPTIONS": {"location": private_dir, "base_url": None},
        },
    }


@pytest.fixture(autouse=True)
def _seed_initial_data(request: pytest.FixtureRequest) -> None:
    """Bảo đảm có dữ liệu seed (tiền tệ, cấu hình, đường dẫn trang) cho test dùng DB.

    Test `transaction=True` flush DB khi kết thúc nên dữ liệu từ data migrations mất ở các test
    sau (nhất là khi chạy `--reuse-db`); fixture tạo lại phần còn thiếu, không đổi bản ghi đã có.
    """
    names = set(request.fixturenames)
    if "transactional_db" in names:
        request.getfixturevalue("transactional_db")
    elif "db" in names:
        request.getfixturevalue("db")
    elif request.node.get_closest_marker("django_db") is None:
        return

    if not Permission._base_manager.exists():
        RoleSeedService().seed(system_only=True)

    seed = import_module("app.system.migrations.0010_seed_currencies")
    for item in seed.CURRENCIES:
        if not Currency._base_manager.filter(code=item["code"]).exists():
            Currency._base_manager.create(**item)

    setting_defaults = (
        {
            "key": "auth_google_enabled",
            "value": True,
            "category": "auth",
            "is_public": True,
            "description": "Cho phép người dùng đăng nhập và liên kết tài khoản Google.",
        },
        {
            "key": "auth_github_enabled",
            "value": True,
            "category": "auth",
            "is_public": True,
            "description": "Cho phép người dùng đăng nhập và liên kết tài khoản GitHub.",
        },
    )
    for setting_item in setting_defaults:
        if not Setting._base_manager.filter(key=setting_item["key"]).exists():
            Setting._base_manager.create(**setting_item)

    page_path_defaults = (
        ("p", "Trang", "Trang cá nhân, giới thiệu, link-in-bio.", 0),
        ("qr", "Mã QR", "Trang chứa mã QR.", 1),
    )
    for segment, name, description, position in page_path_defaults:
        if not PagePath._base_manager.filter(segment=segment).exists():
            PagePath._base_manager.create(
                segment=segment,
                name=name,
                description=description,
                position=position,
            )


@pytest.fixture(autouse=True)
def _sync_email(settings: Any) -> None:
    """Gửi email đồng bộ trong test để kiểm tra mail.outbox tức thì."""
    settings.EMAIL_ASYNC = False


@pytest.fixture
def fake_redis(settings: Any) -> FakeRedis:
    """Bật `CacheService` với Redis giả trong bộ nhớ (đếm được số lệnh)."""
    fake = FakeRedis()
    settings.REDIS_URL = "redis://fake"
    CacheService.use_client(fake, "redis://fake")
    return fake


@pytest.fixture
def client() -> APIClient:
    """API client không kiểm tra CSRF (test CSRF dùng `csrf_client`)."""
    return APIClient()


@pytest.fixture
def csrf_client() -> APIClient:
    """API client có kiểm tra CSRF như trình duyệt thật."""
    return APIClient(enforce_csrf_checks=True)


@pytest.fixture
def login() -> Callable[..., APIClient]:
    """Đăng nhập qua API thật và trả về client đã có cookie."""

    def _login(user: User, password: str = DEFAULT_PASSWORD, client: APIClient | None = None) -> APIClient:
        api = client or APIClient()
        response = api.post(
            "/api/v1/system/auth/login", {"identifier": user.email, "password": password}, format="json"
        )
        assert response.status_code == 200, response.content
        return api

    return _login


@pytest.fixture
def user(db: Any) -> User:
    """Người dùng thường."""
    return UserFactory()


@pytest.fixture
def staff(db: Any) -> User:
    """Người dùng is_staff, chưa có quyền."""
    return StaffFactory()


@pytest.fixture
def superuser(db: Any) -> User:
    """Superuser."""
    return SuperuserFactory()


@pytest.fixture
def staff_with(db: Any) -> Callable[..., User]:
    """Tạo staff có các quyền chỉ định."""

    def _make(*codes: str) -> User:
        member = StaffFactory()
        grant(member, *codes)
        return member

    return _make


@pytest.fixture
def refresh_cookie() -> Callable[[APIClient], str]:
    """Lấy refresh token thô từ cookie jar của client."""

    def _get(api: APIClient) -> str:
        return str(api.cookies[django_settings.AUTH_REFRESH_COOKIE_NAME].value)

    return _get
