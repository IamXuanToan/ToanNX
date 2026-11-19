"""Validate cập nhật thể loại."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class GenreUpdateValidateSerializer(CoreValidateSerializer):
    """Input cập nhật thể loại."""

    name = serializers.CharField(required=False, max_length=100, help_text="Tên thể loại.")
    slug = serializers.CharField(required=False, max_length=100, help_text="Slug định danh.")
    description = serializers.CharField(required=False, allow_blank=True, help_text="Mô tả.")
