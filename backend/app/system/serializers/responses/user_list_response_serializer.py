"""Response từng phần tử của GET /account/users."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from app.system.models.user import User
from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)


class UserListResponseSerializer(serializers.ModelSerializer[User]):
    """Người dùng trong danh sách (không bao giờ có mật khẩu; vai trò lấy ở IAM)."""

    avatar = serializers.SerializerMethodField(help_text="Ảnh đại diện còn tồn tại (id, url) hoặc null.")

    @extend_schema_field(AttachmentSummaryResponseSerializer(allow_null=True))
    def get_avatar(self, obj: User) -> dict[str, object] | None:
        """Ẩn ảnh đã xóa mềm; repository đã nạp avatar để tránh N+1."""
        if obj.avatar is None or obj.avatar.deleted_at is not None:
            return None
        return dict(AttachmentSummaryResponseSerializer(obj.avatar, context=self.context).data)

    class Meta:
        model = User
        fields: tuple[str, ...] = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "avatar",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_novel",
            "last_login",
            "last_seen_at",
        )
