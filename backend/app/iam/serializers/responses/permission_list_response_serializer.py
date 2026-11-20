"""Response từng phần tử của GET /iam/permissions (cũng lồng trong chi tiết vai trò)."""

from rest_framework import serializers

from app.iam.models.permission import Permission


class PermissionListResponseSerializer(serializers.ModelSerializer[Permission]):
    """Thông tin quyền kèm mô tả công dụng."""

    class Meta:
        model = Permission
        fields = ("id", "code", "module", "resource", "action", "name", "description")
