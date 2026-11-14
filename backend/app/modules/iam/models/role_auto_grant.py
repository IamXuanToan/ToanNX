"""Chính sách tự cấp quyền cho vai trò khi đồng bộ quyền."""

from django.db import models


class RoleAutoGrant(models.TextChoices):
    """Vai trò tự nhận quyền nào mỗi lần `sync_iam` chạy (cấu hình trong DB, không hardcode mã vai trò)."""

    NONE = "none", "Không tự cấp (quyền gán thủ công)"
    ALL = "all", "Mọi quyền đang hoạt động"
    READ_ONLY = "read_only", "Mọi quyền đọc (*.read)"
