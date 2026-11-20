"""Response GET/PATCH /account/users/{id}, POST /account/users."""

from app.system.serializers.responses.user_list_response_serializer import (
    UserListResponseSerializer,
)


class UserDetailResponseSerializer(UserListResponseSerializer):
    """Chi tiết người dùng: thêm ngày tham gia và thời điểm tạo/cập nhật."""

    class Meta(UserListResponseSerializer.Meta):
        fields = (*UserListResponseSerializer.Meta.fields, "date_joined", "created_at", "updated_at")
