"""Response từng phần tử của GET /auth/sessions."""

from rest_framework import serializers

from app.authentication.models.auth_session import AuthSession


class SessionListResponseSerializer(serializers.ModelSerializer[AuthSession]):
    """Phiên đăng nhập; `is_current` dựa vào context `current_session_id`."""

    is_current = serializers.SerializerMethodField(help_text="True nếu là phiên của request hiện tại.")

    class Meta:
        model = AuthSession
        fields: tuple[str, ...] = (
            "id",
            "created_at",
            "last_used_at",
            "expires_at",
            "user_agent",
            "ip_address",
            "is_current",
        )

    def get_is_current(self, obj: AuthSession) -> bool:
        """Phiên đang dùng cho request hiện tại.

        Args:
            obj: Phiên.

        Returns:
            True nếu là phiên hiện tại.
        """
        current = self.context.get("current_session_id")
        return current is not None and str(obj.pk) == str(current)
