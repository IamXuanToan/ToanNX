"""Model gán vai trò cho người dùng."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.modules.account.models.user import User
from app.modules.iam.models.role import Role


class UserRole(CoreModel):
    """Gán vai trò cho người dùng (xóa cứng khi thu hồi)."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_roles",
        verbose_name="Người dùng",
        help_text="Người dùng được gán vai trò.",
        db_comment="Người dùng",
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="user_roles",
        verbose_name="Vai trò",
        help_text="Vai trò được gán.",
        db_comment="Vai trò",
    )

    class Meta:
        db_table = "iam_user_role"
        verbose_name = "Vai trò của người dùng"
        verbose_name_plural = "Vai trò của người dùng"
        constraints = [models.UniqueConstraint(fields=["user", "role"], name="uniq_iam_user_role")]

    def __str__(self) -> str:
        """Biểu diễn dạng user → role."""
        return f"{self.user_id} → {self.role_id}"
