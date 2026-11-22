"""Model quyền."""

from django.db import models

from app.core.models.core_model import CoreModel


class Permission(CoreModel):
    """Quyền dạng `module.resource.action`, đồng bộ từ module registry (không tạo qua API)."""

    code = models.CharField(
        max_length=150,
        unique=True,
        verbose_name="Mã quyền",
        db_comment="module.resource.action",
        help_text="Mã quyền dạng `module.resource.action`, ví dụ `system.user.read`.",
    )
    module = models.CharField(
        max_length=32,
        db_index=True,
        verbose_name="Module",
        db_comment="Mã module",
        help_text="Mã module khai báo quyền.",
    )
    resource = models.CharField(
        max_length=64,
        verbose_name="Tài nguyên",
        db_comment="Tài nguyên",
        help_text="Tài nguyên được bảo vệ, ví dụ `user`.",
    )
    action = models.CharField(
        max_length=32,
        verbose_name="Hành động",
        db_comment="Hành động",
        help_text="Hành động, ví dụ `read`, `create`.",
    )
    name = models.CharField(
        max_length=150,
        verbose_name="Tên quyền",
        db_comment="Tên hiển thị",
        help_text="Tên ngắn hiển thị trên UI.",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Mô tả",
        help_text="Quyền này cho phép làm gì.",
        db_comment="Mô tả công dụng của quyền",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Đang hoạt động",
        help_text="False khi module không còn khai báo quyền này.",
        db_comment="Quyền còn được khai báo",
    )

    class Meta:
        db_table = "system_permission"
        verbose_name = "Quyền"
        verbose_name_plural = "Quyền"

    def __str__(self) -> str:
        """Biểu diễn bằng mã."""
        return self.code
