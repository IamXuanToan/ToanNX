"""Metadata của một module đã cài đặt."""

from dataclasses import dataclass, field

from app.core.registry.callback_definition import CallbackDefinition
from app.core.registry.notification_event_definition import NotificationEventDefinition
from app.core.registry.permission_definition import PermissionDefinition
from app.core.registry.webhook_definition import WebhookDefinition
from app.core.validators.core_validator import CoreValidator

# Hành động mở phạm vi sang dữ liệu của mọi người; vai trò thành viên không được có.
SCOPE_WIDENING_ACTIONS = frozenset({"manage_all", "read_private"})


@dataclass(frozen=True)
class ModuleDescriptor:
    """Metadata module.

    Attributes:
        code: Mã module.
        name: Tên hiển thị.
        description: Mô tả.
        version: Phiên bản.
        permissions: Quyền module khai báo.
        dependencies: Mã module phụ thuộc.
        cleanup_tasks: Đường dẫn hàm dọn dữ liệu `() -> int` (chạy bởi `manage.py run_cleanup`).
        notification_events: Sự kiện module có thể phát để gửi thông báo (Email/Telegram).
        webhooks: Webhook module nhận từ bên thứ ba (hiển thị ở Hệ thống → Webhook).
        callbacks: URL bên thứ ba chuyển người dùng về, ví dụ OAuth (hiển thị ở Hệ thống → Callback).
        member_permissions: Quyền của vai trò `<MODULE>_MEMBER` (thao tác bản ghi do mình tạo), lấy từ
            `XxxPermission.member()`. Bắt buộc với module có quyền; không gồm `manage_all`/`read_private`.
    """

    code: str
    name: str
    description: str
    version: str
    permissions: tuple[PermissionDefinition, ...] = field(default_factory=tuple)
    dependencies: tuple[str, ...] = field(default_factory=tuple)
    cleanup_tasks: tuple[str, ...] = field(default_factory=tuple)
    notification_events: tuple[NotificationEventDefinition, ...] = field(default_factory=tuple)
    webhooks: tuple[WebhookDefinition, ...] = field(default_factory=tuple)
    callbacks: tuple[CallbackDefinition, ...] = field(default_factory=tuple)
    member_permissions: tuple[PermissionDefinition, ...] = field(default_factory=tuple)

    def validate(self) -> None:
        """Kiểm tra quy ước mã module và mã quyền.

        Raises:
            ValueError: Metadata sai quy ước.
        """
        if not CoreValidator.is_module_code(self.code):
            raise ValueError(f"Mã module không hợp lệ: {self.code!r}")
        for permission in self.permissions:
            if not CoreValidator.is_permission_code(permission.code):
                raise ValueError(f"Mã quyền không hợp lệ: {permission.code!r}")
            if permission.parts[0] != self.code:
                raise ValueError(f"Quyền {permission.code!r} phải thuộc module {self.code!r}.")
        for event in self.notification_events:
            if not CoreValidator.is_event_code(event.code):
                raise ValueError(f"Mã sự kiện không hợp lệ: {event.code!r}")
            if event.module != self.code:
                raise ValueError(f"Sự kiện {event.code!r} phải thuộc module {self.code!r}.")
            event.validate()
        for webhook in self.webhooks:
            if webhook.module != self.code or not webhook.path.startswith(f"/{self.code}/"):
                raise ValueError(f"Webhook {webhook.code!r} phải thuộc module {self.code!r} (mã và path).")
        for callback in self.callbacks:
            if callback.module != self.code or not callback.path.startswith("/"):
                raise ValueError(
                    f"Callback {callback.code!r} phải thuộc module {self.code!r}, path bắt đầu bằng '/'."
                )
        if self.code in self.dependencies:
            raise ValueError(f"Module {self.code!r} không thể phụ thuộc chính nó.")
        self._validate_member_permissions()

    def _validate_member_permissions(self) -> None:
        """Module có quyền phải khai `member_permissions`; mỗi quyền thuộc module, không mở rộng phạm vi."""
        if not self.permissions:
            return
        if not self.member_permissions:
            raise ValueError(f"Module {self.code!r} phải khai member_permissions (vai trò thành viên).")
        codes = {permission.code for permission in self.permissions}
        for permission in self.member_permissions:
            if permission.code not in codes:
                raise ValueError(
                    f"Quyền thành viên {permission.code!r} không nằm trong permissions của {self.code!r}."
                )
            if permission.action in SCOPE_WIDENING_ACTIONS:
                raise ValueError(
                    f"Quyền thành viên {permission.code!r} mở rộng phạm vi, không cấp cho vai trò thành viên."
                )
