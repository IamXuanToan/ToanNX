"""Thông tin người dùng chuẩn hóa nhận được từ nhà cung cấp OAuth."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class OAuthUserInfo:
    """Dữ liệu tài khoản chuẩn hóa từ nhà cung cấp OAuth."""

    provider: str
    uid: str
    email: str = ""
    display_name: str = ""
    avatar_url: str = ""
    extra_data: dict[str, Any] = field(default_factory=dict)
