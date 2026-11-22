"""Quyền thông báo trình duyệt (Firebase)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class PushDevicePermission(PermissionCatalog):
    """Quyền thông báo trình duyệt (Firebase)."""

    READ = PermissionDefinition(
        code="system.push_device.read",
        name="Xem thiết bị nhận thông báo",
        description="Xem trình duyệt đã bật thông báo.",
    )
    CREATE = PermissionDefinition(
        code="system.push_device.create",
        name="Bật thông báo trình duyệt",
        description="Đăng ký trình duyệt nhận thông báo.",
    )
    DELETE = PermissionDefinition(
        code="system.push_device.delete",
        name="Tắt thông báo trình duyệt",
        description="Gỡ trình duyệt khỏi danh sách nhận.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ, CREATE, DELETE)
