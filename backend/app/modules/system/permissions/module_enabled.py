"""DRF permission chặn API của module đang tắt.

Được core tự gắn vào mọi view (`settings.MODULE_PERMISSION_CLASSES`), view không cần khai báo.
Module của view được suy ra từ app chứa class view (`label` của app = `MODULE.code`, xem
`CoreModuleConfig`). Chỉ khai `module_code` trên view khi view đặt ở app này nhưng thuộc module khác.
"""

from typing import Any

from django.apps import apps
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authorization_error import AuthorizationError
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.modules.system.services.system_module_service import SystemModuleService


def resolve_module_code(view: Any) -> str | None:
    """Mã module của view: `view.module_code` nếu có, ngược lại là label của app chứa class view.

    Args:
        view: View DRF.

    Returns:
        Mã module, hoặc None nếu view không thuộc app nào.
    """
    explicit = getattr(view, "module_code", None)
    if explicit:
        return str(explicit)
    app_config = apps.get_containing_app_config(type(view).__module__)
    return app_config.label if app_config is not None else None


class ModuleEnabled(BasePermission):
    """Từ chối (403 `MODULE_DISABLED`) khi module của view đang tắt.

    View không thuộc module nào trong registry (thư viện ngoài) thì bỏ qua.
    """

    registry: ModuleRegistry = module_registry

    def has_permission(self, request: Request, view: Any) -> bool:
        """Kiểm tra module đang bật.

        Args:
            request: DRF request.
            view: View.

        Returns:
            True nếu module đang bật hoặc view không thuộc module được quản lý.

        Raises:
            AuthorizationError: MODULE_DISABLED.
        """
        code = resolve_module_code(view)
        if code is None or self.registry.get(code) is None:
            return True
        if SystemModuleService(registry=self.registry).is_enabled(code):
            return True
        raise AuthorizationError("Module đang tắt.", code=ErrorCode.MODULE_DISABLED)
