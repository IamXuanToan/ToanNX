"""Model gán quyền cho vai trò."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role import Role


class RolePermission(CoreModel):
    """Gán quyền cho vai trò (xóa cứng khi thu hồi)."""

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="role_permissions",
        verbose_name="Vai trò",
        help_text="Vai trò được cấp quyền.",
        db_comment="Vai trò",
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="role_permissions",
        verbose_name="Quyền",
        help_text="Quyền được cấp.",
        db_comment="Quyền",
    )

    class Meta:
        db_table = "iam_role_permission"
        verbose_name = "Quyền của vai trò"
        verbose_name_plural = "Quyền của vai trò"
        constraints = [
            models.UniqueConstraint(fields=["role", "permission"], name="uniq_iam_role_permission")
        ]

    def __str__(self) -> str:
        """Biểu diễn dạng role → permission."""
        return f"{self.role_id} → {self.permission_id}"
