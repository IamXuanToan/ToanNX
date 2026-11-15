"""Danh mục quyền quản trị phiên đăng nhập."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AuthenticationPermission(PermissionCatalog):
    """Quyền phiên quản trị; API phiên cá nhân vẫn chỉ yêu cầu đăng nhập."""

    SESSION_DELETE = PermissionDefinition(
        code="authentication.session.delete",
        name="Xóa phiên đăng nhập",
        description="Xóa mềm và vô hiệu phiên; chỉ superuser được xóa phiên của superuser.",
    )

    SESSION_READ = PermissionDefinition(
        code="authentication.session.read",
        name="Xem phiên đăng nhập",
        description="Xem danh sách, thiết bị, địa chỉ IP và trạng thái phiên của mọi người dùng.",
    )
    SESSION_REVOKE = PermissionDefinition(
        code="authentication.session.revoke",
        name="Thu hồi phiên đăng nhập",
        description="Thu hồi phiên người dùng; chỉ superuser được thu hồi phiên của superuser.",
    )
