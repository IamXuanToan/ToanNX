"""Kiểu khai báo một vai trò mẫu do `RoleSeedService` tạo/chuẩn hóa."""

from collections.abc import Sequence
from dataclasses import dataclass

from app.system.models.role_auto_grant import RoleAutoGrant


@dataclass(frozen=True)
class PredefinedRoleSpec:
    """Khai báo vai trò mẫu.

    Attributes:
        code: Mã vai trò (khóa để tìm vai trò đã có).
        name: Tên hiển thị.
        description: Mô tả.
        is_system: Vai trò hệ thống (chỉ superuser sửa, không xóa được, được tạo sau mỗi `migrate`).
        auto_grant: Chính sách tự cấp quyền (`all` / `read_only` / `none`).
        permission_patterns: Mã quyền hoặc mẫu `<module>.<resource>.*` cấp cho vai trò không tự cấp quyền.
    """

    code: str
    name: str
    description: str
    is_system: bool = False
    auto_grant: str = RoleAutoGrant.NONE
    permission_patterns: Sequence[str] = ()
