"""Response từng phần tử của GET /iam/roles."""

from rest_framework import serializers

from app.system.models.role import Role


class RoleListResponseSerializer(serializers.ModelSerializer[Role]):
    """Vai trò trong danh sách, kèm số quyền và số người dùng (annotate ở repository)."""

    permission_count = serializers.IntegerField(read_only=True, help_text="Số quyền đã gán cho vai trò.")
    user_count = serializers.IntegerField(read_only=True, help_text="Số người dùng đang có vai trò.")

    class Meta:
        model = Role
        fields: tuple[str, ...] = (
            "id",
            "code",
            "name",
            "description",
            "is_system",
            "auto_grant",
            "is_active",
            "permission_count",
            "user_count",
            "created_at",
            "updated_at",
        )
