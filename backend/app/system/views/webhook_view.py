"""API GET /system/webhooks: webhook các module khai báo, URL theo domain backend đang chạy."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.webhook_permission import WebhookPermission
from app.system.serializers.responses.webhook_response_serializer import WebhookResponseSerializer
from app.system.services.webhook_catalog_service import WebhookCatalogService


class WebhookView(CoreApiView):
    """Danh mục chỉ đọc."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.webhook_catalog_service = WebhookCatalogService()

    @extend_schema(responses=WebhookResponseSerializer(many=True))
    @require_permission(WebhookPermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """Danh sách webhook."""
        return CoreResponse(WebhookResponseSerializer(self.webhook_catalog_service.list(), many=True).data)
