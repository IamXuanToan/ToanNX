"""Cấu hình app System."""

from typing import Any

from django.apps import AppConfig
from django.db.models.signals import post_migrate

from app.core.registry.core_module_config import CoreModuleConfig
from app.core.registry.module_registry import module_registry

# Lý do đổi thông tin đăng nhập ứng với đổi/đặt lại mật khẩu (phát thông báo cho chủ tài khoản).
PASSWORD_REASONS = ("password_changed", "password_reset")


def _seed_after_migrate(sender: AppConfig, **kwargs: Any) -> None:
    """Tạo/chuẩn hóa vai trò hệ thống rồi đồng bộ quyền sau khi migrate (cả sau `flush`)."""
    from app.system.services.role_seed_service import RoleSeedService  # noqa: PLC0415

    RoleSeedService().seed(system_only=True)


def _revoke_sessions_on_credentials_change(sender: Any, user: Any, reason: str, **kwargs: Any) -> None:
    """Đổi mật khẩu hoặc khóa tài khoản → thu hồi mọi phiên của người dùng."""
    from app.system.services.auth_session_service import (  # noqa: PLC0415
        AuthSessionService,
    )

    AuthSessionService().revoke_all(user, reason)


def _notify_on_password_change(sender: Any, user: Any, reason: str, **kwargs: Any) -> None:
    """Đổi/đặt lại mật khẩu → thông báo cho chủ tài khoản."""
    if reason not in PASSWORD_REASONS:
        return
    from app.system.services.login_notification_service import (  # noqa: PLC0415
        LoginNotificationService,
    )

    LoginNotificationService().notify_password_changed(user)


class SystemConfig(CoreModuleConfig):
    """App System: nền tảng dùng chung của mọi module nghiệp vụ.

    Gồm tài khoản (`AUTH_USER_MODEL`), phân quyền IAM, đăng nhập/phiên, thư viện file, lịch sử thay đổi
    (Journal) và kiểm tra tình trạng hệ thống.
    """

    default = True
    name = "app.system"
    label = "system"
    verbose_name = "System"

    def ready(self) -> None:
        """Đăng ký module (CoreModuleConfig) rồi gắn xử lý riêng của module."""
        super().ready()
        from app.system.schemas import (  # noqa: F401, PLC0415 - đăng ký OpenAPI extension
            cookie_jwt_authentication_scheme,
        )
        from app.system.signals import user_credentials_changed  # noqa: PLC0415

        # Quyền của mọi module chỉ đủ sau khi migrate xong → tạo vai trò hệ thống và đồng bộ tại đây.
        post_migrate.connect(_seed_after_migrate, sender=self)
        user_credentials_changed.connect(
            _revoke_sessions_on_credentials_change, dispatch_uid="auth_revoke_on_credentials_change"
        )
        user_credentials_changed.connect(_notify_on_password_change, dispatch_uid="notify_on_password_change")
        # Quyền khai trong sự kiện thông báo phải tồn tại (kiểm khi mọi module đã đăng ký).
        module_registry.validate_notification_permissions()
