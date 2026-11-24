"""Response metadata sản phẩm/liên kết từ URL."""

from typing import Any

from rest_framework import serializers


class PageMetadataResponseSerializer(serializers.Serializer[Any]):
    """Thông tin đọc được từ website đích."""

    title = serializers.CharField(help_text="Tiêu đề sản phẩm/trang web.")
    description = serializers.CharField(allow_blank=True, help_text="Mô tả tóm tắt.")
    image_url = serializers.URLField(allow_null=True, help_text="Ảnh đại diện hoặc null.")
    platform = serializers.CharField(help_text="Nền tảng (shopee, lazada, tiktok, tiki, amazon, custom).")
    site_name = serializers.CharField(help_text="Tên trang web / domain.")
    price = serializers.FloatField(allow_null=True, help_text="Giá bán đọc được hoặc null.")
    currency = serializers.CharField(allow_null=True, help_text="Đơn vị tiền tệ (VND, USD...).")
    canonical_url = serializers.URLField(allow_blank=True, help_text="URL chính tắc của sản phẩm.")
    destination_url = serializers.URLField(help_text="URL đích ban đầu.")
