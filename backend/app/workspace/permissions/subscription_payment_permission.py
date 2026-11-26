"""Quyền lịch sử thanh toán gia hạn dịch vụ."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class SubscriptionPaymentPermission(PermissionCatalog):
    """Quyền xem/xóa lịch sử thanh toán gia hạn (tạo qua action renew)."""

    READ = PermissionDefinition(
        code="workspace.subscription_payment.read",
        name="Xem lịch sử thanh toán gia hạn",
        description="Xem các kỳ đã thanh toán của dịch vụ định kỳ.",
    )
    DELETE = PermissionDefinition(
        code="workspace.subscription_payment.delete",
        name="Xóa lịch sử thanh toán gia hạn",
        description="Xóa mềm bản ghi thanh toán gia hạn.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.subscription_payment.manage_all",
        name="Quản lý mọi thanh toán gia hạn",
        description="Mở phạm vi xem/xóa sang giao dịch của mọi người dùng.",
    )

    MEMBER = (READ, DELETE)
