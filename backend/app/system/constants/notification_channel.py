"""Kênh gửi thông báo. Dùng chung cho các model thông báo."""

from django.db import models


class NotificationChannel(models.TextChoices):
    """Kênh gửi."""

    IN_APP = "IN_APP", "Trong ứng dụng"
    PUSH = "PUSH", "Trình duyệt"
    EMAIL = "EMAIL", "Email"
    TELEGRAM = "TELEGRAM", "Telegram"
