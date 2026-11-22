"""Validate body POST /iam/roles."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.constants.role_code import ROLE_CODE_PATTERN


class RoleCreateValidateSerializer(CoreValidateSerializer):
    """Dữ liệu tạo vai trò."""

    code = serializers.RegexField(
        ROLE_CODE_PATTERN,
        max_length=64,
        help_text="Mã vai trò CHỮ_HOA_SNAKE (2-64 ký tự), không đổi sau khi tạo.",
    )
    name = serializers.CharField(max_length=150, help_text="Tên hiển thị.")
    description = serializers.CharField(
        required=False, allow_blank=True, default="", help_text="Mô tả mục đích vai trò."
    )
    is_active = serializers.BooleanField(required=False, default=True, help_text="Vai trò có hiệu lực.")
