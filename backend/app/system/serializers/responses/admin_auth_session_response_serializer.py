"""Thông tin phiên quản trị, không chứa access/refresh token hoặc token hash."""

from django.utils import timezone
from rest_framework import serializers

from app.system.models.auth_session import AuthSession
from app.system.models.auth_session_status import AuthSessionStatus
from app.system.serializers.responses.session_list_response_serializer import (
    SessionListResponseSerializer,
)


class AdminAuthSessionResponseSerializer(SessionListResponseSerializer):
    """Phiên kèm chủ sở hữu và trạng thái để hiển thị bảng quản trị."""

    user_id = serializers.UUIDField(read_only=True, help_text="UUID chủ sở hữu phiên.")
    user_email = serializers.EmailField(source="user.email", read_only=True, help_text="Email chủ phiên.")
    user_name = serializers.CharField(source="user.full_name", read_only=True, help_text="Họ tên chủ phiên.")
    user_is_superuser = serializers.BooleanField(
        source="user.is_superuser", read_only=True, help_text="Chủ phiên là superuser."
    )
    status = serializers.SerializerMethodField(help_text="ACTIVE, REVOKED hoặc EXPIRED.")

    class Meta(SessionListResponseSerializer.Meta):
        fields = (
            *SessionListResponseSerializer.Meta.fields,
            "user_id",
            "user_email",
            "user_name",
            "user_is_superuser",
            "status",
            "revoked_at",
        )

    def get_status(self, obj: AuthSession) -> str:
        """Tính trạng thái mà không sửa dữ liệu hoặc gia hạn phiên."""
        if obj.revoked_at is not None:
            return AuthSessionStatus.REVOKED
        return AuthSessionStatus.EXPIRED if obj.expires_at <= timezone.now() else AuthSessionStatus.ACTIVE
