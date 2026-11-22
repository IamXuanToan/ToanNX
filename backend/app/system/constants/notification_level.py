"""Mức độ của thông báo. Dùng chung cho các model thông báo."""

from django.db import models


class NotificationLevel(models.TextChoices):
    """Mức độ."""

    INFO = "INFO", "Thông tin"
    WARNING = "WARNING", "Cảnh báo"
    ERROR = "ERROR", "Lỗi"
