"""Response từng phần tử của GET /account/users."""

from rest_framework import serializers

from app.modules.account.models.user import User
from app.modules.attachment.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)


class UserListResponseSerializer(serializers.ModelSerializer[User]):
    """Người dùng trong danh sách (không bao giờ có mật khẩu; vai trò lấy ở IAM)."""

    avatar = AttachmentSummaryResponseSerializer(
        allow_null=True, read_only=True, help_text="Ảnh đại diện (id, url) hoặc null."
    )

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
        )
