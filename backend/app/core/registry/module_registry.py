"""Module registry: danh sách module đã cài đặt.

Phân biệt:
1. Installed: app trong INSTALLED_APPS kế thừa `CoreModuleConfig`, tự đăng ký `module.MODULE` ở `ready()`.
   Module đã cài luôn hoạt động; không có cờ bật/tắt runtime.
2. Quyền người dùng: do IAM quyết định (registry cung cấp danh mục quyền để `sync_iam` đồng bộ).
"""

from app.core.registry.callback_definition import CallbackDefinition
from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.notification_event_definition import NotificationEventDefinition
from app.core.registry.permission_definition import PermissionDefinition
from app.core.registry.webhook_definition import WebhookDefinition


class ModuleRegistry:
    """Registry trong bộ nhớ, dựng lại mỗi lần khởi động."""

    def __init__(self) -> None:
        """Khởi tạo registry rỗng."""
        self._modules: dict[str, ModuleDescriptor] = {}

    def register(self, descriptor: ModuleDescriptor, *, app_label: str | None = None) -> None:
        """Đăng ký module.

        Args:
            descriptor: Metadata module.
            app_label: Label của app đăng ký (CoreModuleConfig truyền vào); phải bằng `descriptor.code`.

        Raises:
            ValueError: Khi metadata sai, trùng mã, hoặc mã module khác label của app.
        """
        descriptor.validate()
        if app_label is not None and descriptor.code != app_label:
            raise ValueError(
                f"Mã module {descriptor.code!r} phải trùng label của app {app_label!r} "
                "(quy ước CoreModuleConfig)."
            )
        existing = self._modules.get(descriptor.code)
        if existing is not None and existing != descriptor:
            raise ValueError(f"Module {descriptor.code!r} đã được đăng ký.")
        self._modules[descriptor.code] = descriptor

    def get(self, code: str) -> ModuleDescriptor | None:
        """Lấy module theo mã.

        Args:
            code: Mã module.

        Returns:
            Descriptor hoặc None nếu chưa cài.
        """
        return self._modules.get(code)

    def all(self) -> list[ModuleDescriptor]:
        """Tất cả module theo thứ tự mã.

        Returns:
            Danh sách descriptor.
        """
        return [self._modules[code] for code in sorted(self._modules)]

    def permission_definitions(self) -> list[PermissionDefinition]:
        """Tất cả quyền do các module khai báo.

        Returns:
            Danh sách định nghĩa quyền.
        """
        return [permission for module in self.all() for permission in module.permissions]

    def notification_event_definitions(self) -> list[NotificationEventDefinition]:
        """Tất cả sự kiện thông báo do các module khai báo.

        Returns:
            Danh sách định nghĩa sự kiện.
        """
        return [event for module in self.all() for event in module.notification_events]

    def validate_notification_permissions(self) -> None:
        """Quyền khai trong sự kiện thông báo phải tồn tại (gọi khi mọi module đã đăng ký).

        Raises:
            ValueError: Sự kiện tham chiếu quyền không có.
        """
        codes = {permission.code for permission in self.permission_definitions()}
        for event in self.notification_event_definitions():
            if event.permission is not None and event.permission not in codes:
                raise ValueError(
                    f"Sự kiện {event.code!r} tham chiếu quyền không tồn tại {event.permission!r}."
                )

    def find_notification_event(self, code: str) -> NotificationEventDefinition | None:
        """Tìm sự kiện thông báo theo mã.

        Args:
            code: Mã sự kiện.

        Returns:
            Định nghĩa sự kiện hoặc None nếu không module nào khai báo.
        """
        return next((event for event in self.notification_event_definitions() if event.code == code), None)

    def webhook_definitions(self) -> list[WebhookDefinition]:
        """Tất cả webhook do các module khai báo.

        Returns:
            Danh sách webhook theo thứ tự module.
        """
        return [webhook for module in self.all() for webhook in module.webhooks]

    def callback_definitions(self) -> list[CallbackDefinition]:
        """Tất cả callback do các module khai báo.

        Returns:
            Danh sách callback theo thứ tự module.
        """
        return [callback for module in self.all() for callback in module.callbacks]


module_registry = ModuleRegistry()
