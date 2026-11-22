"""API GET /system/callbacks: URL callback các module khai báo, theo origin FE đang dùng."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.callback_permission import CallbackPermission
from app.system.serializers.responses.callback_response_serializer import CallbackResponseSerializer
from app.system.services.callback_catalog_service import CallbackCatalogService


class CallbackView(CoreApiView):
    """Danh mục chỉ đọc."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.callback_catalog_service = CallbackCatalogService()

    @extend_schema(responses=CallbackResponseSerializer(many=True))
    @require_permission(CallbackPermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """Danh sách callback."""
        return CoreResponse(CallbackResponseSerializer(self.callback_catalog_service.list(), many=True).data)
