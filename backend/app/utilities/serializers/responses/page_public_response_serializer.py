"""Response trang công khai."""

from typing import Any

from rest_framework import serializers


class PagePublicResponseSerializer(serializers.Serializer[Any]):
    """Dữ liệu an toàn để FE render (không có owner, attachment id thô)."""

    id = serializers.UUIDField(help_text="Id trang.")
    segment = serializers.CharField(help_text="Đường dẫn giữa.")
    slug = serializers.CharField(help_text="Slug.")
    status = serializers.CharField(help_text="Trạng thái hiện tại.")
    preview = serializers.BooleanField(help_text="True = bản chưa công khai, chỉ người có quyền thấy.")
    title = serializers.CharField(help_text="Tiêu đề trang.")
    description = serializers.CharField(help_text="Mô tả trang.")
    canonical_url = serializers.URLField(help_text="URL chính tắc tuyệt đối.")
    seo_title = serializers.CharField(help_text="Tiêu đề SEO hiệu lực.")
    seo_description = serializers.CharField(help_text="Mô tả SEO hiệu lực.")
    avatar_url = serializers.URLField(allow_null=True, help_text="Ảnh đại diện hoặc null.")
    cover_url = serializers.URLField(allow_null=True, help_text="Ảnh bìa hoặc null.")
    background_image_url = serializers.URLField(allow_null=True, help_text="Ảnh nền toàn trang hoặc null.")
    theme = serializers.JSONField(help_text="Theme đã validate.")
    page_type = serializers.CharField(help_text="Loại trang (AFFILIATE, BIO, DONATION, LEGACY_PAGE...).")
    template_key = serializers.CharField(help_text="Mã template.")
    template_version = serializers.IntegerField(help_text="Phiên bản template.")
    content_config = serializers.JSONField(help_text="Dữ liệu nội dung theo template.")
    style_config = serializers.JSONField(help_text="Cấu hình giao diện.")
    responsive_config = serializers.JSONField(help_text="Cấu hình responsive.")
    content = serializers.JSONField(
        help_text="Tiptap JSON; ảnh/nút link rút gọn không còn dùng được đã bị bỏ."
    )
