"""Danh mục quyền cho tài nguyên Mã QR (QrCode)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class QrCodePermission(PermissionCatalog):
    """Quyền mã QR theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="utilities.qr_code.read", name="Xem mã QR", description="Xem mã QR của mình và lịch sử thay đổi."
    )
    CREATE = PermissionDefinition(
        code="utilities.qr_code.create",
        name="Tạo mã QR",
        description="Tạo mã QR (ảnh lưu vào Thư viện của mình).",
    )
    UPDATE = PermissionDefinition(
        code="utilities.qr_code.update",
        name="Sửa mã QR",
        description="Sửa nội dung/kiểu dáng; ảnh đã chèn tự cập nhật.",
    )
    DELETE = PermissionDefinition(
        code="utilities.qr_code.delete", name="Xóa mã QR", description="Xóa mềm mã QR và ảnh của nó."
    )
    MANAGE_ALL = PermissionDefinition(
        code="utilities.qr_code.manage_all",
        name="Quản lý mọi mã QR",
        description="Đọc và thao tác mã QR của mọi người dùng khi có quyền action tương ứng.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ, CREATE, UPDATE, DELETE)
