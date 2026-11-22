"""Khóa cấu hình hệ thống (`system.Setting.key`) dùng trong code."""

from enum import StrEnum


class SettingKey(StrEnum):
    """Khóa cấu hình đã biết; khóa mới thêm vào đây thay vì viết chuỗi trực tiếp."""

    AUTH_GOOGLE_ENABLED = "auth_google_enabled"
    AUTH_GITHUB_ENABLED = "auth_github_enabled"

    @classmethod
    def social_login(cls, provider: str) -> str:
        """Khóa bật/tắt đăng nhập mạng xã hội theo provider (`google`, `github`)."""
        return f"auth_{provider.lower()}_enabled"
