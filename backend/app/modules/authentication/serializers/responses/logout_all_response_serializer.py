"""Response POST /auth/logout-all."""

from typing import Any

from rest_framework import serializers


class LogoutAllResponseSerializer(serializers.Serializer[Any]):
    """Số phiên đã thu hồi."""

    revoked_sessions = serializers.IntegerField(help_text="Số phiên đã bị thu hồi.")
