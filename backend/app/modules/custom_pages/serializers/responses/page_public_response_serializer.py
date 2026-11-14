"""Response trang công khai."""

from rest_framework import serializers


class PagePublicResponseSerializer(serializers.Serializer):
    """Dữ liệu an toàn để frontend render trang công khai."""

    title = serializers.CharField(help_text="Tiêu đề trang.")
    description = serializers.CharField(help_text="Mô tả trang.")
    canonical_url = serializers.URLField(help_text="URL chính tắc tuyệt đối.")
    seo_title = serializers.CharField(help_text="Tiêu đề SEO hiệu lực.")
    seo_description = serializers.CharField(help_text="Mô tả SEO hiệu lực.")
    avatar_url = serializers.URLField(allow_null=True, help_text="Ảnh đại diện hoặc null.")
    cover_url = serializers.URLField(allow_null=True, help_text="Ảnh bìa hoặc null.")
    theme = serializers.JSONField(help_text="Theme được validate.")
    blocks = serializers.JSONField(help_text="Block công khai đã lọc, theo position.")
