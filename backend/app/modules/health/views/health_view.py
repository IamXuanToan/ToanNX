"""API GET /health (liveness)."""

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.public_api_view import PublicApiView
from app.modules.health.serializers.responses.health_response_serializer import HealthResponseSerializer


class HealthView(PublicApiView):
    """Tiến trình đang chạy."""

    @extend_schema(responses=HealthResponseSerializer)
    def get(self, request: Request) -> CoreResponse:
        """Trả trạng thái ok.

        Args:
            request: Request.

        Returns:
            Trạng thái.
        """
        return CoreResponse(HealthResponseSerializer({"status": "ok", "debug": settings.DEBUG}).data)
