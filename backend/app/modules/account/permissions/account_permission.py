"""Danh mục quyền của module Account."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AccountPermission(PermissionCatalog):
    """Quyền Account. Mỗi quyền ghi rõ cho phép làm gì."""

    USER_READ = PermissionDefinition(
        code="account.user.read",
        name="Xem người dùng",
        description="Xem danh sách, tìm kiếm và xem chi tiết tài khoản người dùng.",
    )
    USER_CREATE = PermissionDefinition(
        code="account.user.create",
        name="Tạo người dùng",
        description="Tạo tài khoản mới (hệ thống không có đăng ký công khai).",
    )
    USER_UPDATE = PermissionDefinition(
        code="account.user.update",
        name="Cập nhật người dùng",
        description="Sửa thông tin, đặt lại mật khẩu, khóa/mở tài khoản, bật quyền vào quản trị.",
    )
    USER_DELETE = PermissionDefinition(
        code="account.user.delete",
        name="Xóa người dùng",
        description="Xóa (mềm) tài khoản, thu hồi mọi phiên; không xóa chính mình hay superuser cuối.",
    )
