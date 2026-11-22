"""API phiên đăng nhập của chính mình.

GET    /auth/sessions
DELETE /auth/sessions/{session_id}
"""

from typing import Any
from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.session_list_response_serializer import (
    SessionListResponseSerializer,
)
from app.system.services.auth_cookie_service import AuthCookieService
from app.system.services.auth_session_service import AuthSessionService


class SessionView(CoreApiView):
    """Danh sách phiên còn hiệu lực."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.auth_session_service = AuthSessionService()

    @extend_schema(responses=SessionListResponseSerializer(many=True))
    def get(self, request: Request) -> CoreResponse:
        """Danh sách phiên (đánh dấu phiên hiện tại).

        Args:
            request: Request.

        Returns:
            Danh sách phiên.
        """
        sessions = self.auth_session_service.list_sessions(self.get_actor(request))
        context = {"current_session_id": getattr(request.auth, "pk", None)}
        return CoreResponse(SessionListResponseSerializer(sessions, many=True, context=context).data)


class SessionObjectView(CoreApiView):
    """Thu hồi một phiên của chính mình."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.auth_cookie_service = AuthCookieService()
        self.auth_session_service = AuthSessionService()

    @extend_schema(responses={204: None})
    def delete(self, request: Request, session_id: UUID) -> Response:
        """Thu hồi phiên; xóa cookie nếu là phiên hiện tại.

        Args:
            request: Request.
            session_id: Id phiên.

        Returns:
            204 không body.
        """
        self.auth_session_service.revoke_session(self.get_actor(request), session_id)
        response = Response(status=204)
        if str(getattr(request.auth, "pk", "")) == str(session_id):
            self.auth_cookie_service.clear_cookies(response)
        return response
