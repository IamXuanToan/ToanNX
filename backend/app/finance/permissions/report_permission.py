"""Quyền báo cáo tài chính."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class ReportPermission(PermissionCatalog):
    """Quyền báo cáo tài chính."""

    READ = PermissionDefinition(
        code="finance.report.read",
        name="Xem báo cáo",
        description="Xem dashboard và báo cáo trong phạm vi xem thu nhập.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ,)
