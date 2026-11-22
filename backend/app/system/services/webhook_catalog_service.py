"""Danh mục webhook của mọi module (khai trong `ModuleDescriptor.webhooks`)."""

from typing import Any

from app.core.registry.module_registry import module_registry
from app.core.utils.url import build_backend_url


class WebhookCatalogService:
    """Không lưu DB: đọc registry, dựng URL theo domain backend đang nhận request."""

    def list(self) -> list[dict[str, Any]]:
        """Webhook theo module, kèm URL đầy đủ.

        Returns:
            Danh sách webhook.
        """
        return [
            {
                "code": item.code,
                "module": item.module,
                "name": item.name,
                "provider": item.provider,
                "method": item.method,
                "path": f"/api/v1{item.path}",
                "url": build_backend_url(f"/api/v1{item.path}"),
                "description": item.description,
                "auth": item.auth,
                "setup": list(item.setup),
            }
            for item in module_registry.webhook_definitions()
        ]
