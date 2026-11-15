"""API GET /auth/csrf."""

from typing import Any

from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.modules.authentication.serializers.responses.csrf_response_serializer import (
    CsrfResponseSerializer,
)


@method_decorator(ensure_csrf_cookie, name="get")
class CsrfView(CoreApiView):
    """Cấp CSRF cookie cho SPA trước khi gửi request thay đổi trạng thái."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    @extend_schema(responses=CsrfResponseSerializer)
    def get(self, request: Request) -> CoreResponse:
        """Cấp CSRF token.

        Args:
            request: Request.

        Returns:
            CSRF token (cũng nằm trong cookie `csrftoken`).
        """
        return CoreResponse(CsrfResponseSerializer({"csrf_token": get_token(request._request)}).data)
