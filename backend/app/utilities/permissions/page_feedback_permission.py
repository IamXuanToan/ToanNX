"""Quyền quản lý Góp ý & Báo lỗi ẩn danh trên Custom Page / ShortLink."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class PageFeedbackPermission(PermissionCatalog):
    """Quyền xem, xử lý, xóa và gửi lời cảm ơn cho góp ý nhận được."""

    READ = PermissionDefinition(
        code="utilities.page_feedback.read",
        name="Xem góp ý / báo lỗi",
        description="Xem danh sách và chi tiết góp ý, báo lỗi trên trang hoặc link rút gọn của mình.",
    )
    UPDATE = PermissionDefinition(
        code="utilities.page_feedback.update",
        name="Xử lý góp ý / báo lỗi",
        description="Cập nhật trạng thái và ghi chú xử lý góp ý.",
    )
    DELETE = PermissionDefinition(
        code="utilities.page_feedback.delete",
        name="Xóa góp ý / báo lỗi",
        description="Xóa mềm góp ý / báo lỗi.",
    )
    THANK = PermissionDefinition(
        code="utilities.page_feedback.thank",
        name="Gửi lời cảm ơn người góp ý",
        description="Gửi email cảm ơn tới người đã góp ý sau khi xử lý xong.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="utilities.page_feedback.manage_all",
        name="Quản trị góp ý toàn hệ thống",
        description="Xem, lọc theo người dùng, xử lý và cảm ơn mọi góp ý trên toàn hệ thống.",
    )

    MEMBER = (READ, UPDATE, DELETE, THANK)
