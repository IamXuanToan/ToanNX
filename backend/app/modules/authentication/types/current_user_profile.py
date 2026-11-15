"""Dữ liệu `/auth/me`: người dùng, vai trò và quyền hiệu lực."""

from dataclasses import dataclass

from app.modules.account.models.user import User
from app.modules.iam.models.role import Role


@dataclass(frozen=True)
class CurrentUserProfile:
    """Hồ sơ người dùng hiện tại (service dựng sẵn, serializer chỉ chuyển đổi)."""

    user: User
    roles: list[Role]
    permissions: list[str]
