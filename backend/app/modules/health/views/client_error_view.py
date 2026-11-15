"""API POST /health/client-errors: FE gửi lỗi trình duyệt để ghi log (và Sentry khi bật).

Công khai vì lỗi xảy ra cả ở trang công khai; có CSRF và rate limit theo IP. Ghi log mức ERROR kèm request id,
Sentry (nếu bật) bắt log này thành event.
"""

import logging
from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.permissions.csrf_protected import CsrfProtected
from app.core.views.core_api_view import CoreApiView
from app.modules.health.serializers.validates.client_error_report_validate_serializer import (
    ClientErrorReportValidateSerializer,
)

logger = logging.getLogger("app.client")


class ClientErrorView(CoreApiView):
    """Nhận báo lỗi từ error boundary của FE."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny, CsrfProtected]

    @extend_schema(responses={204: None})
    @rate_limit("health.client_error")
    @validate_request(ClientErrorReportValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> Response:
        """Ghi lỗi vào log.

        Args:
            request: Request.
            validated_data: Thông tin lỗi.

        Returns:
            204 không body.
        """
        logger.error(
            "Lỗi trình duyệt tại %s: %s",
            validated_data["url"],
            validated_data["message"],
            extra={
                "client_digest": validated_data.get("digest", ""),
                "client_stack": validated_data.get("stack", ""),
            },
        )
        return Response(status=204)
