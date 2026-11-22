"""Validate tạo/sửa thẻ."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class TagValidateSerializer(CoreValidateSerializer):
    """Input tạo hoặc sửa thẻ."""

    name = serializers.CharField(max_length=100, help_text="Tên thẻ.")
    slug = serializers.CharField(required=False, max_length=100, help_text="Slug định danh.")
