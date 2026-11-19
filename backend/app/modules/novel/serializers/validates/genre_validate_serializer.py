"""Validate tạo/sửa thể loại."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class GenreValidateSerializer(CoreValidateSerializer):
    """Input tạo hoặc sửa thể loại."""

    name = serializers.CharField(max_length=100, help_text="Tên thể loại.")
    slug = serializers.CharField(required=False, max_length=100, help_text="Slug định danh.")
    description = serializers.CharField(required=False, allow_blank=True, help_text="Mô tả thể loại.")
