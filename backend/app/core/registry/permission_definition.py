"""Định nghĩa một quyền do module khai báo."""

from dataclasses import dataclass


@dataclass(frozen=True)
class PermissionDefinition:
    """Quyền `module.resource.action` kèm tên và mô tả công dụng.

    Attributes:
        code: Mã quyền, ví dụ `system.user.read`.
        name: Tên ngắn hiển thị trên UI.
        description: Quyền này cho phép làm gì (đọc là hiểu, không cần mở code).
    """

    code: str
    name: str
    description: str

    @property
    def parts(self) -> tuple[str, str, str]:
        """Tách (module, resource, action)."""
        module, resource, action = self.code.split(".")
        return module, resource, action

    @property
    def action(self) -> str:
        """Hành động (phần cuối của mã)."""
        return self.parts[2]
