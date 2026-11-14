"""Metadata của một module đã cài đặt."""

from dataclasses import dataclass, field

from app.core.registry.module_group import ModuleGroup
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
        group: Nhóm module.
        permissions: Quyền module khai báo.
        dependencies: Mã module phụ thuộc.
        is_core: Module lõi, không thể tắt.
        icon: Icon mặc định (tên lucide-react kebab-case); quản trị viên có thể đổi ở SystemModule.
    """

    code: str
    name: str
    description: str
    version: str
    group: ModuleGroup
    permissions: tuple[PermissionDefinition, ...] = field(default_factory=tuple)
    dependencies: tuple[str, ...] = field(default_factory=tuple)
    is_core: bool = False
    icon: str = "box"

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
        if not CoreValidator.is_icon_name(self.icon):
            raise ValueError(f"Tên icon không hợp lệ: {self.icon!r}")
        if self.code in self.dependencies:
            raise ValueError(f"Module {self.code!r} không thể phụ thuộc chính nó.")
