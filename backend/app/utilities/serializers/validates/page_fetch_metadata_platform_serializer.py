"""Serializer validate cấu hình một nơi bán (platform + regex URL) của trang Affiliate."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PageFetchMetadataPlatformSerializer(CoreValidateSerializer):
    """Một cấu hình nơi bán riêng của trang dùng để nhận diện URL khi lấy link nhanh."""

    code = serializers.CharField(
        max_length=64,
        help_text="Mã shortcode nơi bán (ví dụ: shopee, tiktok_shop, my_store).",
    )
    name = serializers.CharField(
        max_length=80,
        required=False,
        allow_blank=True,
        default="",
        help_text="Tên hiển thị của nơi bán.",
    )
    url_pattern = serializers.CharField(
        max_length=300,
        required=False,
        allow_blank=True,
        default="",
        help_text="Biểu thức Regex hoặc domain để nhận diện URL thuộc nơi bán này.",
    )
