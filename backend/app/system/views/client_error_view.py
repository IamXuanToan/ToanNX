"""API POST /health/client-errors: FE gửi lỗi trình duyệt để ghi log.

Công khai vì lỗi xảy ra cả ở trang công khai; có CSRF và rate limit theo IP. Ghi log mức ERROR kèm request id.
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
from app.system.constants.system_rate_limit_key import SystemRateLimitKey
from app.system.serializers.validates.client_error_report_validate_serializer import (
    ClientErrorReportValidateSerializer,
)

logger = logging.getLogger("app.client")


class ClientErrorView(CoreApiView):
    """Nhận báo lỗi từ error boundary của FE."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny, CsrfProtected]

    @extend_schema(responses={204: None})
    @rate_limit(SystemRateLimitKey.CLIENT_ERROR_CREATE)
    @validate_request(ClientErrorReportValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> Response:
        """Ghi lỗi vào log.

        Args:
            request: Request.
            validated_data: Thông tin lỗi.

        Returns:
            204 không body.
        """
        stack = str(validated_data.get("stack") or "").strip()
        digest = str(validated_data.get("digest") or "").strip()
        url = validated_data["url"]
        message = validated_data["message"]

        if stack:
            log_message = (
                f"Lỗi trình duyệt tại {url}: {message}\n"
                f"==================== [CLIENT ERROR DETAIL] ====================\n"
                f"URL: {url}\n"
                f"Digest: {digest or 'N/A'}\n"
                f"Message: {message}\n"
                f"Stack Trace:\n{stack}\n"
                f"================================================================"
            )
        else:
            log_message = f"Lỗi trình duyệt tại {url}: {message}"

        logger.error(
            log_message,
            extra={
                "client_digest": digest,
                "client_stack": stack,
                "client_url": url,
            },
        )
        return Response(status=204)
