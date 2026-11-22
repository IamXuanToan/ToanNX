"""POST /system/notifications/dispatch: gửi nốt outbox thông báo ở một lượt function riêng.

Hai bên được gọi:
- **QStash** (ngay sau khi có thông báo, hoặc hẹn trễ cho lần thử lại): header `Upstash-Signature` hợp lệ →
  luôn query DB và gửi.
- **Cron ngoài** (cron-job.org, lưới an toàn): `Authorization: Bearer <CRON_SECRET>` → mốc trong Redis chưa
  tới thì trả `sent=0` ngay, **không mở kết nối DB** (Neon được ngủ).
Sai hoặc thiếu cả hai → 404 (không lộ endpoint tồn tại).
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
from app.system.services.qstash_client import QstashClient

SIGNATURE_HEADER = "Upstash-Signature"


class NotificationDispatchView(CoreApiView):
    """Không cookie, không IAM; xác thực bằng chữ ký QStash hoặc bí mật cron."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.notification_service = NotificationService()
        self.qstash_client = QstashClient()

    @extend_schema(request=None, responses=NotificationDispatchResponseSerializer)
    def post(self, request: Request) -> CoreResponse:
        """Gửi một lô bản đến hạn.

        Raises:
            NotFoundError: Không phải QStash, chưa cấu hình hoặc sai bí mật cron.
        """
        signature = request.headers.get(SIGNATURE_HEADER, "")
        if signature:
            if not self.qstash_client.verify(signature, request.body, request.path):
                raise NotFoundError()
            sent = self.notification_service.dispatch_pending(force=True)
        else:
            secret = settings.CRON_SECRET
            provided = request.headers.get("Authorization", "").removeprefix("Bearer ")
            if not secret or not hmac.compare_digest(provided, secret):
                raise NotFoundError()
            sent = self.notification_service.dispatch_pending()
        return CoreResponse(NotificationDispatchResponseSerializer({"sent": sent}).data)
