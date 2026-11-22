"""GET /system/notifications (chuông của mình) · DELETE /system/notifications/{id} (ẩn)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.decorators.validate_request import validate_request
from app.core.pagination.core_page_number_pagination import CorePageNumberPagination
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.constants.notification_defaults import NOTIFICATION_PAGE_SIZE
from app.system.decorators.require_permission import require_permission
from app.system.permissions.notification_permission import NotificationPermission
from app.system.serializers.responses.notification_response_serializer import NotificationResponseSerializer
from app.system.serializers.validates.notification_list_validate_serializer import (
    NotificationListValidateSerializer,
)
from app.system.services.notification_service import NotificationService


class NotificationView(CoreApiView):
    """Danh sách chuông theo tab, luôn phân trang (mặc định 20)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.notification_service = NotificationService()

    @extend_schema(responses=NotificationResponseSerializer(many=True))
    @require_permission(NotificationPermission.READ)
    @validate_request(NotificationListValidateSerializer)
    def get(self, request: Request, validated_data: dict[str, Any]) -> Response:
        """Thông báo mới nhất trước; không gửi `page` thì trả trang đầu."""
        queryset = self.notification_service.list_for(
            self.get_actor(request), validated_data.get("scope"), validated_data["unread"]
        )
        paginator = CorePageNumberPagination()
        paginator.page_size = NOTIFICATION_PAGE_SIZE
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is None:
            return CoreResponse(
                NotificationResponseSerializer(queryset[:NOTIFICATION_PAGE_SIZE], many=True).data
            )
        return paginator.get_paginated_response(NotificationResponseSerializer(page, many=True).data)


class NotificationObjectView(CoreApiView):
    """Ẩn một thông báo của mình khỏi chuông."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.notification_service = NotificationService()

    @extend_schema(responses={204: None})
    @require_permission(NotificationPermission.READ)
    def delete(self, request: Request, pk: Any) -> CoreResponse:
        """Xóa cứng thông báo của chính mình."""
        self.notification_service.hide(self.get_actor(request), pk)
        return CoreResponse(None, status=204)
