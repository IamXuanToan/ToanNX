"""Validate POST /utilities/pages/fetch-metadata."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.utilities.serializers.validates.page_fetch_metadata_platform_serializer import (
    PageFetchMetadataPlatformSerializer,
)


class PageFetchMetadataValidateSerializer(CoreValidateSerializer):
    """Input URL cần trích xuất metadata."""

    url = serializers.URLField(max_length=2048, help_text="URL sản phẩm hoặc liên kết cần đọc metadata.")
    platforms = PageFetchMetadataPlatformSerializer(
        many=True,
        required=False,
        default=list,
        help_text="Danh sách nơi bán và regex URL riêng của trang Affiliate.",
    )
