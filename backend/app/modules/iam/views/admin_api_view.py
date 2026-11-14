"""APIView gốc cho mọi API quản trị không theo CRUD chuẩn (action, sub-resource)."""

from rest_framework.permissions import BasePermission

from app.modules.iam.permissions.has_declared_permission import HasDeclaredPermission
from app.modules.iam.permissions.is_active_authenticated import IsActiveAuthenticated
from app.modules.iam.permissions.is_admin_area import IsAdminArea
from app.modules.iam.views.authenticated_api_view import AuthenticatedApiView


class AdminApiView(AuthenticatedApiView):
    """Thứ tự: đăng nhập + active → is_staff → method đã gắn `@require_permission`
    → kiểm tra quyền (decorator) → `@validate_request` → xử lý.
    """

    permission_classes: list[type[BasePermission]] = [
        IsActiveAuthenticated,
        IsAdminArea,
        HasDeclaredPermission,
    ]
