"""API GET /health/ready (readiness: database)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.constants.error_codes import ErrorCode
from app.core.responses.core_error_response import CoreErrorResponse
from app.core.responses.core_response import CoreResponse
from app.core.views.public_api_view import PublicApiView
from app.modules.health.serializers.responses.readiness_response_serializer import (
    ReadinessResponseSerializer,
)
from app.modules.health.services.health_service import HealthService


class ReadinessView(PublicApiView):
    """Database sẵn sàng."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.health_service = HealthService()

    @extend_schema(responses={200: ReadinessResponseSerializer, 503: None})
    def get(self, request: Request) -> Response:
        """Kiểm tra kết nối database.

        Args:
            request: Request.

        Returns:
            200 nếu sẵn sàng, 503 nếu không.
        """
        if not self.health_service.is_database_ready():
            return CoreErrorResponse(ErrorCode.SERVICE_UNAVAILABLE, "Database không sẵn sàng.", 503)
        return CoreResponse(ReadinessResponseSerializer({"status": "ready"}).data)
