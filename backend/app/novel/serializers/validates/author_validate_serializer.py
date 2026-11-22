"""Validate tạo/sửa tác giả."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class AuthorValidateSerializer(CoreValidateSerializer):
    """Input tạo hoặc sửa tác giả."""

    name = serializers.CharField(max_length=255, help_text="Tên tác giả.")
    slug = serializers.CharField(required=False, max_length=255, help_text="Slug định danh.")
    bio = serializers.CharField(required=False, allow_blank=True, help_text="Tiểu sử.")
    avatar_id = serializers.UUIDField(required=False, allow_null=True, help_text="Mã ảnh đại diện.")
