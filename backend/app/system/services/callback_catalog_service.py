"""Danh mục callback của mọi module (khai trong `ModuleDescriptor.callbacks`)."""

from typing import Any

from django.conf import settings

from app.core.context.user_context import get_current_request
from app.core.registry.module_registry import module_registry
from app.system.utils.frontend_url import get_frontend_origin


class CallbackCatalogService:
    """Không lưu DB: đọc registry, dựng URL theo origin FE của request (đổi site vẫn đúng)."""

    def list(self) -> list[dict[str, Any]]:
        """Callback theo module, kèm URL đầy đủ và cờ đã cấu hình.

        Returns:
            Danh sách callback.
        """
        origin = get_frontend_origin(get_current_request())
        return [
            {
                "code": item.code,
                "module": item.module,
                "name": item.name,
                "provider": item.provider,
                "path": item.path,
                "url": f"{origin}{item.path}",
                "description": item.description,
                "setup": list(item.setup),
                "configured": bool(getattr(settings, item.setting, "")) if item.setting else True,
            }
            for item in module_registry.callback_definitions()
        ]
