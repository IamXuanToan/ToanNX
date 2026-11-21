"""Response từng phần tử của GET /account/users."""

from typing import Any

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from app.system.models.user import User
from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)
from app.system.serializers.responses.user_connected_social_summary_response_serializer import (
    UserConnectedSocialSummaryResponseSerializer,
)


class UserListResponseSerializer(serializers.ModelSerializer[User]):
    """Người dùng trong danh sách (không bao giờ có mật khẩu; vai trò lấy ở IAM)."""

    avatar = serializers.SerializerMethodField(help_text="Ảnh đại diện còn tồn tại (id, url) hoặc null.")
    social_accounts = serializers.SerializerMethodField(
        help_text="Danh sách tài khoản mạng xã hội đang liên kết."
    )

    @extend_schema_field(AttachmentSummaryResponseSerializer(allow_null=True))
    def get_avatar(self, obj: User) -> dict[str, object] | None:
        """Ẩn ảnh đã xóa mềm; repository đã nạp avatar để tránh N+1."""
        if obj.avatar is None or obj.avatar.deleted_at is not None:
            return None
        return dict(AttachmentSummaryResponseSerializer(obj.avatar, context=self.context).data)

    @extend_schema_field(UserConnectedSocialSummaryResponseSerializer(many=True))
    def get_social_accounts(self, obj: User) -> list[dict[str, Any]]:
        """Danh sách tài khoản mạng xã hội đang liên kết (đã prefetch)."""
        accounts = getattr(obj, "social_accounts", None)
        if accounts is None:
            return []
        items = accounts.all() if hasattr(accounts, "all") else accounts
        return [
            {
                "id": item.id,
                "provider": item.provider,
                "uid": item.uid,
                "email": item.email,
                "display_name": item.display_name,
                "avatar_url": item.avatar_url,
                "created_at": item.created_at,
            }
            for item in items
            if getattr(item, "deleted_at", None) is None
        ]

    class Meta:
        model = User
        fields: tuple[str, ...] = (
            "id",
            "email",
            "username",
            "full_name",
            "avatar",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_novel",
            "is_verified",
            "social_accounts",
            "last_login",
            "last_seen_at",
        )
