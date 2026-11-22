"""Model vai trò."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker
from app.system.models.role_auto_grant import RoleAutoGrant


class Role(JournalTracker, CoreModel):
    """Vai trò gom nhóm quyền. Một người dùng có thể có nhiều vai trò."""

    code = models.CharField(
        max_length=64,
        unique=True,
        verbose_name="Mã vai trò",
        help_text="CHỮ_HOA_SNAKE, không đổi sau khi tạo.",
        db_comment="Mã vai trò",
    )
    name = models.CharField(
        max_length=150,
        verbose_name="Tên vai trò",
        db_comment="Tên vai trò",
        help_text="Tên hiển thị của vai trò.",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Mô tả",
        db_comment="Mô tả",
        help_text="Mô tả mục đích của vai trò.",
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name="Vai trò hệ thống",
        help_text="Do hệ thống tạo (RoleSeedService sau migrate); chỉ superuser được sửa.",
        db_comment="Vai trò hệ thống",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Đang hoạt động",
        help_text="Vai trò tắt không cấp quyền.",
        db_comment="Vai trò còn hiệu lực",
    )
    auto_grant = models.CharField(
        max_length=16,
        choices=RoleAutoGrant.choices,
        default=RoleAutoGrant.NONE,
        verbose_name="Tự cấp quyền",
        help_text="Khi đồng bộ quyền, vai trò tự nhận mọi quyền / mọi quyền đọc / không tự nhận.",
        db_comment="Chính sách tự cấp quyền khi sync_iam",
    )

    class Meta:
        db_table = "system_role"
        verbose_name = "Vai trò"
        verbose_name_plural = "Vai trò"

    def __str__(self) -> str:
        """Biểu diễn bằng mã."""
        return self.code
