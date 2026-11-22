"""Quyền kết nối SePay của chính mình."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class SepayPermission(PermissionCatalog):
    """Quyền kết nối SePay của chính mình."""

    MANAGE = PermissionDefinition(
        code="finance.sepay.manage",
        name="Kết nối SePay",
        description="Cấu hình token, webhook, lấy giao dịch thủ công của mình.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (MANAGE,)
