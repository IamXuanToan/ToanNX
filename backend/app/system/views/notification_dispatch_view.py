"""POST /system/notifications/dispatch: cron ngoài (cron-job.org mỗi 1–5 phút) gửi nốt outbox.

Giống `/system/health/cleanup`: `Authorization: Bearer <CRON_SECRET>`, `CRON_SECRET` rỗng hoặc sai → 404.
"""

import hmac
from typing import Any

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.exceptions.not_found_error import NotFoundError
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.notification_dispatch_response_serializer import (
    NotificationDispatchResponseSerializer,
)
from app.system.services.notification_service import NotificationService


class NotificationDispatchView(CoreApiView):
    """Không cookie, không IAM; xác thực bằng bí mật cron."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.notification_service = NotificationService()

    @extend_schema(request=None, responses=NotificationDispatchResponseSerializer)
    def post(self, request: Request) -> CoreResponse:
        """Gửi một lô bản đến hạn.

        Raises:
            NotFoundError: Chưa cấu hình hoặc sai bí mật (không lộ endpoint tồn tại).
        """
        secret = settings.CRON_SECRET
        provided = request.headers.get("Authorization", "").removeprefix("Bearer ")
        if not secret or not hmac.compare_digest(provided, secret):
            raise NotFoundError()
        sent = self.notification_service.dispatch_pending()
        return CoreResponse(NotificationDispatchResponseSerializer({"sent": sent}).data)
