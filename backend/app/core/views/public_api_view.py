"""View công khai: không xác thực, ai cũng gọi được."""

from typing import Any

from rest_framework.permissions import AllowAny, BasePermission

from app.core.views.core_api_view import CoreApiView


class PublicApiView(CoreApiView):
    """Không chạy authentication (cookie hết hạn không làm hỏng request công khai).

    Dùng cho endpoint chỉ đọc công khai (health, csrf).
    """

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]
