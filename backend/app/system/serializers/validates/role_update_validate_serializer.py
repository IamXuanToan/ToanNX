"""Validate body PATCH /iam/roles/{id}."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class RoleUpdateValidateSerializer(CoreValidateSerializer):
    """Dữ liệu cập nhật vai trò (mã vai trò không đổi được)."""

    name = serializers.CharField(required=False, max_length=150, help_text="Tên hiển thị.")
    description = serializers.CharField(required=False, allow_blank=True, help_text="Mô tả mục đích vai trò.")
    is_active = serializers.BooleanField(
        required=False, help_text="Bật/tắt vai trò (tắt thì không cấp quyền)."
    )
