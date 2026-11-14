"""Dữ liệu `/auth/me`: người dùng, vai trò, quyền hiệu lực và module đang bật."""

from dataclasses import dataclass

from app.modules.account.models.user import User
from app.modules.iam.models.role import Role
from app.modules.system.types.module_state import ModuleState


@dataclass(frozen=True)
class CurrentUserProfile:
    """Hồ sơ người dùng hiện tại (service dựng sẵn, serializer chỉ chuyển đổi)."""

    user: User
    roles: list[Role]
    permissions: list[str]
    modules: list[ModuleState]
