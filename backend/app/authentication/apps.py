"""Cấu hình app Authentication."""

from typing import Any

from app.core.registry.core_module_config import CoreModuleConfig


def _revoke_sessions_on_credentials_change(sender: Any, user: Any, reason: str, **kwargs: Any) -> None:
    """Đổi mật khẩu hoặc khóa tài khoản → thu hồi mọi phiên của người dùng."""
    from app.authentication.services.auth_session_service import (  # noqa: PLC0415
        AuthSessionService,
    )

    AuthSessionService().revoke_all(user, reason)


class AuthenticationConfig(CoreModuleConfig):
    """App Authentication: đăng nhập, phiên, refresh token."""

    default = True
    name = "app.authentication"
    label = "authentication"
    verbose_name = "Authentication"

    def ready(self) -> None:
        """Đăng ký module (CoreModuleConfig) rồi gắn xử lý riêng của module."""
        super().ready()
        from app.account.signals import user_credentials_changed  # noqa: PLC0415
        from app.authentication.schemas import (  # noqa: F401, PLC0415 - đăng ký OpenAPI extension
            cookie_jwt_authentication_scheme,
        )

        user_credentials_changed.connect(
            _revoke_sessions_on_credentials_change, dispatch_uid="auth_revoke_on_credentials_change"
        )
