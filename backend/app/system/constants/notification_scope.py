"""Tab hiển thị trong chuông thông báo. Dùng chung cho các model thông báo."""

from django.db import models


class NotificationScope(models.TextChoices):
    """Tab hiển thị trong chuông."""

    PERSONAL = "PERSONAL", "Cá nhân"
    SYSTEM = "SYSTEM", "Hệ thống"
