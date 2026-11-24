"""Validate POST /utilities/pages/fetch-metadata."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PageFetchMetadataValidateSerializer(CoreValidateSerializer):
    """Input URL cần trích xuất metadata."""

    url = serializers.URLField(max_length=2048, help_text="URL sản phẩm hoặc liên kết cần đọc metadata.")
