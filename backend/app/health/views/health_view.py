"""API GET /health (liveness)."""

from typing import Any

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.health.serializers.responses.health_response_serializer import HealthResponseSerializer


class HealthView(CoreApiView):
    """Tiến trình đang chạy."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    @extend_schema(responses=HealthResponseSerializer)
    def get(self, request: Request) -> CoreResponse:
        """Trả trạng thái ok.

        Args:
            request: Request.

        Returns:
            Trạng thái.
        """
        return CoreResponse(HealthResponseSerializer({"status": "ok", "debug": settings.DEBUG}).data)
