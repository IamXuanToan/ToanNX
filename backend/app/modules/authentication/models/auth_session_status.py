"""Trạng thái tính từ thời hạn và thời điểm thu hồi phiên."""

from django.db import models


class AuthSessionStatus(models.TextChoices):
    """Trạng thái phục vụ lọc/hiển thị; không lưu thêm cột có thể lệch dữ liệu phiên."""

    ACTIVE = "ACTIVE", "Hoạt động"
    REVOKED = "REVOKED", "Đã thu hồi"
    EXPIRED = "EXPIRED", "Hết hạn"
