"""Response GET/POST /iam/users/{user_id}/roles: vai trò rút gọn."""

from rest_framework import serializers

from app.modules.iam.models.role import Role


class RoleSummaryResponseSerializer(serializers.ModelSerializer[Role]):
    """Id, mã, tên, trạng thái vai trò."""

    class Meta:
        model = Role
        fields = ("id", "code", "name", "is_system", "is_active")
