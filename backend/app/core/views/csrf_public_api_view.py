"""View công khai có thay đổi trạng thái bằng cookie (login, refresh, logout)."""

from rest_framework.permissions import AllowAny, BasePermission

from app.core.permissions.csrf_protected import CsrfProtected
from app.core.views.public_api_view import PublicApiView


class CsrfPublicApiView(PublicApiView):
    """Không xác thực nhưng bắt buộc CSRF (chống login CSRF và giả mạo refresh/logout)."""

    permission_classes: list[type[BasePermission]] = [AllowAny, CsrfProtected]
