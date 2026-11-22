"""Khai báo vai trò mẫu: một vai trò `ADMIN` và ba vai trò (quản lý, xem, thành viên) cho mỗi module đã cài.

Không khai vai trò nghiệp vụ tự đặt (tiếp thị, tác giả...); quản trị viên tự tạo khi cần. Vai trò theo module
do `RoleSeedService.predefined_roles()` dựng từ module registry, nên module mới cài tự có vai trò của mình.
"""

from app.system.models.role_auto_grant import RoleAutoGrant
from app.system.types.predefined_role_spec import PredefinedRoleSpec

# Vai trò hệ thống duy nhất: mọi quyền của mọi module (kể cả module cài sau, qua `auto_grant`).
ADMIN_ROLE = PredefinedRoleSpec(
    code="ADMIN",
    name="Quản trị viên",
    description="Toàn bộ quyền của mọi module đã cài.",
    is_system=True,
    auto_grant=RoleAutoGrant.ALL,
)

# Vai trò theo module: `<MÃ_MODULE>_MANAGER` có mọi quyền của module, `<MÃ_MODULE>_VIEWER` chỉ quyền `read`.
MODULE_MANAGER_CODE = "{module}_MANAGER"
MODULE_MANAGER_NAME = "Quản lý {module}"
MODULE_MANAGER_DESCRIPTION = "Toàn bộ quyền của module {module}."
MODULE_MANAGER_PATTERN = "{module}.*"

MODULE_VIEWER_CODE = "{module}_VIEWER"
MODULE_VIEWER_NAME = "Xem {module}"
MODULE_VIEWER_DESCRIPTION = "Chỉ quyền xem (read) của module {module}."
MODULE_VIEWER_PATTERN = "{module}.*.read"

# `<MÃ_MODULE>_MEMBER`: thao tác bản ghi do mình tạo, quyền lấy từ `ModuleDescriptor.member_permissions`.
MODULE_MEMBER_CODE = "{module}_MEMBER"
MODULE_MEMBER_NAME = "Thành viên {module}"
MODULE_MEMBER_DESCRIPTION = "Xem, tạo, sửa, xóa dữ liệu do chính mình tạo trong module {module}."
