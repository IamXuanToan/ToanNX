"""Danh mục quyền cho tài nguyên Giao dịch quyên góp (DonationTransaction)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class DonationPermission(PermissionCatalog):
    """Quyền quyên góp theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="utilities.donation.read",
        name="Xem quyên góp",
        description="Xem danh sách và thống kê quyên góp của mình.",
    )
    UPDATE = PermissionDefinition(
        code="utilities.donation.update",
        name="Sửa quyên góp",
        description="Ẩn hoặc hiện bình luận quyên góp trên trang của mình.",
    )
    EXPORT = PermissionDefinition(
        code="utilities.donation.export",
        name="Xuất báo cáo quyên góp",
        description="Xuất danh sách quyên góp của mình ra tệp CSV.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="utilities.donation.manage_all",
        name="Quản lý mọi quyên góp",
        description="Xem, kiểm duyệt và xuất báo cáo quyên góp của tất cả người dùng toàn hệ thống.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình sở hữu.
    MEMBER = (READ, UPDATE, EXPORT)
