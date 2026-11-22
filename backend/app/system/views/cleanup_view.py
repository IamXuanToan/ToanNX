"""API GET /health/cleanup: Vercel Cron gọi hằng ngày để dọn dữ liệu hết hạn.

Vercel Cron gửi `Authorization: Bearer <CRON_SECRET>`. `CRON_SECRET` rỗng thì endpoint trả 404.
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
from app.system.serializers.responses.cleanup_response_serializer import CleanupResponseSerializer
from app.system.services.cleanup_service import CleanupService


class CleanupView(CoreApiView):
    """Công khai nhưng chặn bằng bí mật dùng chung (không dùng cookie)."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.cleanup_service = CleanupService()

    @extend_schema(responses=CleanupResponseSerializer)
    def get(self, request: Request) -> CoreResponse:
        """Chạy mọi task dọn dữ liệu.

        Args:
            request: Request có header `Authorization: Bearer <CRON_SECRET>`.

        Returns:
            Số bản ghi đã xóa theo task.

        Raises:
            NotFoundError: Chưa cấu hình bí mật hoặc bí mật sai (không lộ endpoint tồn tại).
        """
        secret = settings.CRON_SECRET
        provided = request.headers.get("Authorization", "").removeprefix("Bearer ")
        if not secret or not hmac.compare_digest(provided, secret):
            raise NotFoundError()
        results = self.cleanup_service.run_all()
        return CoreResponse(CleanupResponseSerializer({"results": results}).data)
