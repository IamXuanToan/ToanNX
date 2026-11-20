"""Fixture dùng chung. Test chạy trên DB `test_toannx` do pytest-django tạo."""

from collections.abc import Callable
from typing import Any

import pytest
from django.conf import settings as django_settings
from rest_framework.test import APIClient

from app.modules.account.models.user import User
from app.modules.account.tests.factories.staff_factory import StaffFactory
from app.modules.account.tests.factories.superuser_factory import SuperuserFactory
from app.modules.account.tests.factories.user_factory import DEFAULT_PASSWORD, UserFactory
from app.modules.iam.tests.helpers.permission_helper import grant


@pytest.fixture(autouse=True)
def _fast_hasher(settings: Any) -> None:
    """Hasher nhanh cho test (cấu hình thật dùng Argon2, có test riêng)."""
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture(autouse=True)
def _isolated_media(settings: Any, tmp_path: Any) -> None:
    """Mỗi test ghi file vào thư mục tạm, không đụng `backend/media` của dev."""
    media_dir = str(tmp_path / "media")
    settings.MEDIA_ROOT = media_dir
    settings.MEDIA_URL = "/media/"
    settings.STORAGES = {
        **settings.STORAGES,
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
            "OPTIONS": {"location": media_dir, "base_url": "/media/"},
        },
    }


@pytest.fixture(autouse=True)
def _sync_email(settings: Any) -> None:
    """Gửi email đồng bộ trong test để kiểm tra mail.outbox tức thì."""
    settings.EMAIL_ASYNC = False


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
            "/api/v1/auth/login", {"identifier": user.email, "password": password}, format="json"
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
