"""Metadata của một module đã cài đặt."""

from dataclasses import dataclass, field

from app.core.registry.permission_definition import PermissionDefinition
from app.core.validators.core_validator import CoreValidator


@dataclass(frozen=True)
class ModuleDescriptor:
    """Metadata module.

    Attributes:
        code: Mã module.
        name: Tên hiển thị.
        description: Mô tả.
        version: Phiên bản.
        permissions: Quyền module khai báo.
        dependencies: Mã module phụ thuộc.
        cleanup_tasks: Đường dẫn hàm dọn dữ liệu `() -> int` (chạy bởi `manage.py run_cleanup`).
    """

    code: str
    name: str
    description: str
    version: str
    permissions: tuple[PermissionDefinition, ...] = field(default_factory=tuple)
    dependencies: tuple[str, ...] = field(default_factory=tuple)
    cleanup_tasks: tuple[str, ...] = field(default_factory=tuple)

    def validate(self) -> None:
        """Kiểm tra quy ước mã module và mã quyền.

        Raises:
            ValueError: Metadata sai quy ước.
        """
        if not CoreValidator.is_module_code(self.code):
            raise ValueError(f"Mã module không hợp lệ: {self.code!r}")
        for permission in self.permissions:
            if not CoreValidator.is_permission_code(permission.code):
                raise ValueError(f"Mã quyền không hợp lệ: {permission.code!r}")
            if permission.parts[0] != self.code:
                raise ValueError(f"Quyền {permission.code!r} phải thuộc module {self.code!r}.")
        if self.code in self.dependencies:
            raise ValueError(f"Module {self.code!r} không thể phụ thuộc chính nó.")
