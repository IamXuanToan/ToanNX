"""API GET /health/ready (readiness: database)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.constants.error_codes import ErrorCode
from app.core.responses.core_error_response import CoreErrorResponse
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.readiness_response_serializer import (
    ReadinessResponseSerializer,
)
from app.system.services.health_service import HealthService


class ReadinessView(CoreApiView):
    """Database sẵn sàng."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

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
