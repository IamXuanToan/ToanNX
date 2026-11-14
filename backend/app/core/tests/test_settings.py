"""Test cấu hình bảo mật quan trọng."""

from django.conf import settings

from config import settings as config_settings


def test_production_hasher_is_argon2() -> None:
    """Cấu hình thật (không phải fixture test) dùng Argon2 làm hasher chính."""
    assert config_settings.PASSWORD_HASHERS[0].endswith("Argon2PasswordHasher")
    assert settings.AUTH_USER_MODEL == "account.User"
