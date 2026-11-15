"""Một mục lịch sử thay đổi (chỉ thêm, không sửa, không xóa mềm)."""

import uuid

from django.conf import settings
from django.db import models


class JournalEntry(models.Model):
    """Thay đổi của một bản ghi do `JournalTracker` phát ra."""

    class Action(models.TextChoices):
        """Loại thay đổi."""

        CREATE = "CREATE", "Tạo"
        UPDATE = "UPDATE", "Cập nhật"
        DELETE = "DELETE", "Xóa"
        EVENT = "EVENT", "Sự kiện"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="Mã định danh",
        db_comment="Khóa chính UUID",
        help_text="Định danh UUID do hệ thống sinh.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Thời điểm",
        db_comment="Thời điểm thay đổi",
        help_text="Thời điểm thay đổi được ghi.",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        db_constraint=False,
        verbose_name="Người thực hiện",
        db_comment="Người thực hiện (NULL = hệ thống)",
        help_text="NULL nếu do hệ thống (migration, lệnh quản trị).",
    )
    actor_label = models.CharField(
        max_length=254,
        blank=True,
        verbose_name="Tên người thực hiện",
        db_comment="Email người thực hiện lúc ghi",
        help_text="Giữ lại để vẫn đọc được khi người dùng bị xóa.",
    )
    request_id = models.CharField(
        max_length=64,
        blank=True,
        verbose_name="Request id",
        db_comment="Id request (khớp log)",
        help_text="Khớp header X-Request-ID.",
    )
    resource = models.CharField(
        max_length=100,
        verbose_name="Tài nguyên",
        db_comment="<module>.<model>",
        help_text="Ví dụ `short_links.shortlink`.",
    )
    object_id = models.CharField(
        max_length=64,
        verbose_name="Id bản ghi",
        db_comment="Khóa chính của bản ghi",
        help_text="Khóa chính của bản ghi thay đổi.",
    )
    object_label = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Tên bản ghi",
        db_comment="str(instance) lúc ghi",
        help_text="Tên bản ghi lúc thay đổi.",
    )
    action = models.CharField(
        max_length=10,
        choices=Action.choices,
        verbose_name="Hành động",
        db_comment="CREATE/UPDATE/DELETE/EVENT",
        help_text="Loại thay đổi.",
    )
    event = models.CharField(
        max_length=64,
        blank=True,
        verbose_name="Sự kiện",
        db_comment="Mã sự kiện khi action = EVENT",
        help_text="Ví dụ `iam.role_assigned`.",
    )
    changes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Thay đổi",
        db_comment="{field: [cũ, mới]}",
        help_text="Field ẩn ghi `***`.",
    )

    class Meta:
        db_table = "journal_entry"
        verbose_name = "Nhật ký thay đổi"
        verbose_name_plural = "Nhật ký thay đổi"
        ordering = ("-created_at", "-pk")
        indexes = [
            models.Index(fields=["resource", "object_id", "-created_at"], name="journal_object_idx"),
            models.Index(fields=["actor", "-created_at"], name="journal_actor_idx"),
            models.Index(fields=["created_at"], name="journal_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(action__in=["CREATE", "UPDATE", "DELETE", "EVENT"]),
                name="journal_action_valid",
            )
        ]

    def __str__(self) -> str:
        """Biểu diễn ngắn gọn."""
        return f"{self.action} {self.resource}:{self.object_id}"
