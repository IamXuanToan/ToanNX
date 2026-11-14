"""APIView gốc cho API người dùng thường (không cần `is_staff`) nhưng cần quyền IAM."""

from rest_framework.permissions import BasePermission

from app.modules.iam.permissions.has_declared_permission import HasDeclaredPermission
from app.modules.iam.permissions.is_active_authenticated import IsActiveAuthenticated
from app.modules.iam.views.authenticated_api_view import AuthenticatedApiView


class MemberApiView(AuthenticatedApiView):
    """Thứ tự: đăng nhập + active → method đã gắn `@require_permission` → kiểm tra quyền.

    Khác `AdminApiView`: không yêu cầu `is_staff`. Dùng cho chức năng người dùng tự quản lý dữ liệu
    của mình (ví dụ trang cá nhân); quyền trên từng đối tượng (owner) do service kiểm tra.
    Kiểm tra module đang bật được core gắn tự động.
    """

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated, HasDeclaredPermission]
